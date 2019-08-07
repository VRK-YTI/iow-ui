import { IHttpService, IPromise, IQService } from 'angular';
import * as moment from 'moment';
import { PredicateService } from './predicateService';
import { upperCaseFirst } from 'change-case';
import { Uri, Urn } from '../entities/uri';
import { reverseMapType } from '../utils/entity';
import { expandContextWithKnownModels } from '../utils/entity';
import { hasLocalization } from '../utils/language';
import { Language } from '../types/language';
import { DataSource } from '../components/form/dataSource';
import { modelScopeCache } from '../components/form/cache';
import { requireDefined } from 'yti-common-ui/utils/object';
import { GraphData, KnownPredicateType, ClassRelationType } from '../types/entity';
import { FrameService } from './frameService';
import * as frames from '../entities/frames';
import { ClassListItem, Class, Property } from '../entities/class';
import { Model } from '../entities/model';
import { ExternalEntity } from '../entities/externalEntity';
import { Predicate, Attribute, Association } from '../entities/predicate';
import { flatten } from 'yti-common-ui/utils/array';
import { apiEndpointWithName } from './config';

export class RelatedClass {
  constructor(public oldClassId: Uri, public relationType: ClassRelationType) {
  }
}

export interface ClassService {
  getClass(id: Uri|Urn, model: Model): IPromise<Class>;
  getAllClasses(model: Model): IPromise<ClassListItem[]>;
  getClassesForModel(model: Model): IPromise<ClassListItem[]>;
  getClassesForModelDataSource(modelProvider: () => Model): DataSource<ClassListItem>;
  getClassesAssignedToModel(model: Model): IPromise<ClassListItem[]>;
  createClass(klass: Class): IPromise<any>;
  updateClass(klass: Class, originalId: Uri): IPromise<any>;
  deleteClass(id: Uri, model: Model): IPromise<any>;
  assignClassToModel(classId: Uri, model: Model): IPromise<any>;
  newClass(model: Model, classLabel: string, conceptID: Uri|null, lang: Language): IPromise<Class>;
  newRelatedClass(model: Model, relatedClass: RelatedClass): IPromise<Class>;
  newShape(classOrExternal: Class|ExternalEntity, profile: Model, external: boolean, lang: Language): IPromise<Class>;
  newClassFromExternal(externalId: Uri, model: Model): IPromise<Class>;
  getExternalClass(externalId: Uri, model: Model): IPromise<Class|null>;
  getExternalClassesForModel(model: Model): IPromise<ClassListItem[]>;
  newProperty(predicateOrExternal: Predicate|ExternalEntity, type: KnownPredicateType, model: Model): IPromise<Property>;
  getInternalOrExternalClass(id: Uri, model: Model): IPromise<Class|null>;
  clearCachedClasses(modelId: string): void;
}

export class DefaultClassService implements ClassService {

  private modelClassesCache = new Map<string, ClassListItem[]>();

  constructor(private $http: IHttpService, private $q: IQService, private defaultPredicateService: PredicateService, private frameService: FrameService) {
    'ngInject';
  }

  getClass(id: Uri|Urn, model: Model): IPromise<Class> {
    return this.$http.get<GraphData>(apiEndpointWithName('class'), {params: {id: id.toString()}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializeClass(response.data!, false))
      .then(klass => requireDefined(klass));
  }

  getAllClasses(model: Model): IPromise<ClassListItem[]> {
    return this.$http.get<GraphData>(apiEndpointWithName('class'))
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializeClassList(response.data!));
  }

  getClassesForModel(model: Model) {
    return this.getAllClasses(model)
      .then(classes => classes.filter(klass => klass.id.resolves())); // if resolves, it is known namespace
  }

  getClassesForModelDataSource(modelProvider: () => Model): DataSource<ClassListItem> {

    const cachedResultsProvider = modelScopeCache(modelProvider,  model => {
      return this.$q.all([
        this.getClassesForModel(model),
        this.getExternalClassesForModel(model)
      ]).then(flatten);
    });

    return () => cachedResultsProvider();
  }

  getClassesAssignedToModel(model: Model): IPromise<ClassListItem[]> {

    const classes = this.modelClassesCache.get(model.id.uri);

    if (classes) {
      return this.$q.when(classes);
    } else {
      return this.$http.get<GraphData>(apiEndpointWithName('class'), {params: {model: model.id.uri}})
        .then(expandContextWithKnownModels(model))
        .then(response => this.deserializeClassList(response.data!))
        .then(classList => {
          this.modelClassesCache.set(model.id.uri, classList);
          return classList;
        });
    }
  }

  createClass(klass: Class): IPromise<any> {
    const requestParams = {
      id: klass.id.uri,
      model: requireDefined(klass.definedBy).id.uri
    };
    return this.$http.put<{ identifier: Urn }>(apiEndpointWithName('class'), klass.serialize(), {params: requestParams})
      .then(response => {
        this.modelClassesCache.delete(requireDefined(klass.definedBy).id.uri);
        klass.unsaved = false;
        klass.version = response.data!.identifier;
        klass.createdAt = moment();
      });
  }

  updateClass(klass: Class, originalId: Uri): IPromise<any> {
    const requestParams: any = {
      id: klass.id.uri,
      model: requireDefined(klass.definedBy).id.uri
    };
    if (klass.id.notEquals(originalId)) {
      requestParams.oldid = originalId.uri;
    }
    return this.$http.post<{ identifier: Urn }>(apiEndpointWithName('class'), klass.serialize(), {params: requestParams})
      .then(response => {
        this.modelClassesCache.delete(requireDefined(klass.definedBy).id.uri);
        klass.version = response.data!.identifier;
        klass.modifiedAt = moment();
      });
  }

  deleteClass(id: Uri, model: Model): IPromise<any> {
    const requestParams = {
      id: id.uri,
      model: model.id.uri
    };
    return this.$http.delete(apiEndpointWithName('class'), {params: requestParams})
      .then(() => this.modelClassesCache.delete(model.id.uri));
  }

  assignClassToModel(classId: Uri, model: Model): IPromise<any> {
    const requestParams = {
      id: classId.uri,
      model: model.id.uri
    };
    return this.$http.post(apiEndpointWithName('class'), undefined, {params: requestParams})
      .then(() => this.modelClassesCache.delete(model.id.uri));
  }

  clearCachedClasses(modelId: string) {
    this.modelClassesCache.delete(modelId);
  }

  newClass(model: Model, classLabel: string, conceptID: Uri|null, lang: Language): IPromise<Class> {

    const params: any = {
      modelID: model.id.uri,
      classLabel: upperCaseFirst(classLabel),
      lang
    };

    if (conceptID !== null) {
      params.conceptID = conceptID.uri;
    }

    return this.$http.get<GraphData>(apiEndpointWithName('classCreator'), {params})
      .then(expandContextWithKnownModels(model))
      .then((response: any) => this.deserializeClass(response.data, false))
      .then((klass: Class) => {
        klass.definedBy = model.asDefinedBy();
        klass.unsaved = true;
        klass.external = model.isNamespaceKnownToBeNotModel(klass.definedBy.id.toString());
        return klass;
      });
  }

  newRelatedClass(model: Model, relatedClass: RelatedClass): IPromise<Class> {

    const params: any = {
      modelID: model.id.uri,
      oldClass: relatedClass.oldClassId.uri,
      relationType: relatedClass.relationType
    };

    return this.$http.get<GraphData>(apiEndpointWithName('relatedClassCreator'), {params})
      .then(expandContextWithKnownModels(model))
      .then((response: any) => this.deserializeClass(response.data, false))
      .then((klass: Class) => {
        klass.definedBy = model.asDefinedBy();
        klass.unsaved = true;
        klass.external = model.isNamespaceKnownToBeNotModel(klass.definedBy.id.toString());
        return klass;
      });
  }

  newShape(classOrExternal: Class|ExternalEntity, profile: Model, external: boolean, lang: Language): IPromise<Class> {

    const id = requireDefined(classOrExternal.id);
    const classPromise = (classOrExternal instanceof ExternalEntity) ? this.getExternalClass(id, profile) : this.$q.when(<Class> classOrExternal);

    return this.$q.all([
      classPromise,
      this.$http.get<GraphData>(apiEndpointWithName('shapeCreator'), {params: {profileID: profile.id.uri, classID: id.toString(), lang}})
        .then(expandContextWithKnownModels(profile))
        .then((response: any) => this.deserializeClass(response.data, false))
      ])
      .then(([klass, shape]: [Class, Class]) => {

        shape.definedBy = profile.asDefinedBy();
        shape.unsaved = true;
        shape.external = external;

        if (!hasLocalization(shape.label)) {
          if (klass && klass.label) {
            shape.label = klass.label;
          } else if (classOrExternal instanceof ExternalEntity) {
            Object.assign(shape, { label: { [classOrExternal.language]: classOrExternal.label } } );
          }
        }

        for (const property of shape.properties) {
          property.status = 'DRAFT';
        }

        shape.status = 'DRAFT';

        return shape;
      });
  }

  newClassFromExternal(externalId: Uri, model: Model) {
    return this.getExternalClass(externalId, model)
      .then(klass => {
        if (!klass) {
          const graph = {
            '@id': externalId.uri,
            '@type': reverseMapType('class'),
            isDefinedBy: model.namespaceAsDefinedBy(externalId.namespace).serialize(true, false)
          };
          return new Class(graph, model.context, model.frame);
        } else {
          return klass;
        }
      });
  }

  getExternalClass(externalId: Uri, model: Model) {
    return this.$http.get<GraphData>(apiEndpointWithName('externalClass'), {params: {model: model.id.uri, id: externalId.uri}})
      .then(expandContextWithKnownModels(model))
      .then((response: any) => this.deserializeClass(response.data, true))
      .then(klass => {
        if (klass) {
          klass.external = true;
        }
        return klass;
      });
  }

  getExternalClassesForModel(model: Model) {
    return this.$http.get<GraphData>(apiEndpointWithName('externalClass'), {params: {model: model.id.uri}})
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializeClassList(response.data!));
  }

  newProperty(predicateOrExternal: Predicate|ExternalEntity, type: KnownPredicateType, model: Model): IPromise<Property> {

    const id = requireDefined(predicateOrExternal.id);
    const predicatePromise = (predicateOrExternal instanceof ExternalEntity) ? this.defaultPredicateService.getExternalPredicate(id, model)
                                                                             : this.$q.when(<Predicate> predicateOrExternal);

    return this.$q.all([
      predicatePromise,
      this.$http.get<GraphData>(apiEndpointWithName('classProperty'), {params: {predicateID: id.toString(), type: reverseMapType(type)}})
        .then(expandContextWithKnownModels(model))
        .then((response: any) => this.deserializeProperty(response.data))
    ])
      .then(([predicate, property]: [Predicate, Property]) => {

        if (!hasLocalization(property.label)) {
          if (predicate && predicate.label) {
            property.label = predicate.label;
          } else if (predicateOrExternal instanceof ExternalEntity) {
            Object.assign(property, { label: { [predicateOrExternal.language]: predicateOrExternal.label } } );
          }
        }

        if (type === 'attribute' && !property.dataType) {
          property.dataType = (predicate instanceof Attribute) ? predicate.dataType : 'xsd:string';
        } else if (type === 'association' && !property.valueClass && predicate instanceof Association) {
          property.valueClass = predicate.valueClass;
        }

        property.status = 'DRAFT';

        return property;
      });
  }

  getInternalOrExternalClass(id: Uri, model: Model) {
    return model.isNamespaceKnownToBeNotModel(id.namespace) ? this.getExternalClass(id, model) : this.getClass(id, model);
  }

  private deserializeClassList(data: GraphData): IPromise<ClassListItem[]> {
    // console.log('data', data);
    return this.frameService.frameAndMapArray(data, frames.classListFrame(data), () => ClassListItem);
  }

  private deserializeClass(data: GraphData, optional: boolean): IPromise<Class|null> {
    return this.frameService.frameAndMap(data, optional, frames.classFrame(data), () => Class);
  }

  private deserializeProperty(data: GraphData): IPromise<Property> {
    return this.frameService.frameAndMap(data, false, frames.propertyFrame(data), () => Property).then(requireDefined);
  }
}
