import * as _  from 'lodash';
import { Uri } from './entities';

const label = { '@id': 'http://www.w3.org/2000/01/rdf-schema#label', '@container': '@language' };
const title = { '@id': 'http://purl.org/dc/terms/title', '@container': '@language' };
const comment = { '@id': 'http://www.w3.org/2000/01/rdf-schema#comment', '@container': '@language' };
const example = { '@id': 'http://www.w3.org/2004/02/skos/core#example', '@container': '@language' };
const prefLabel = { '@id': 'http://www.w3.org/2004/02/skos/core#prefLabel', '@container': '@language' };
const inScheme = { '@id': 'http://www.w3.org/2004/02/skos/core#inScheme'};
const datatype = { '@id': 'http://www.w3.org/ns/shacl#datatype', '@type': '@id' };
const subClassOf = { '@id': 'http://www.w3.org/2000/01/rdf-schema#subClassOf', '@type': '@id' };
const subPropertyOf = { '@id': 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf', '@type': '@id' };
const property = { '@id': 'http://www.w3.org/ns/shacl#property', '@type': '@id' };
const modified = { '@id': 'http://purl.org/dc/terms/modified', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' };
const created = { '@id': 'http://purl.org/dc/terms/created', '@type': 'http://www.w3.org/2001/XMLSchema#dateTime' };
const isDefinedBy = { '@id': 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', '@type': '@id' };
const predicate = { '@id': 'http://www.w3.org/ns/shacl#predicate', '@type': '@id' };
const valueShape = { '@id': 'http://www.w3.org/ns/shacl#valueShape', '@type': '@id' };
const pattern = { '@id': 'http://www.w3.org/ns/shacl#pattern'};
const minCount = { '@id': 'http://www.w3.org/ns/shacl#minCount'};
const maxCount = { '@id': 'http://www.w3.org/ns/shacl#maxCount'};
const index = { '@id': 'http://www.w3.org/ns/shacl#index'};
const nodeKind = { '@id': 'http://www.w3.org/ns/shacl#nodeKind', '@type': '@id' };
const references = { '@id': 'http://purl.org/dc/terms/references', '@type': '@id' };
const requires = { '@id': 'http://purl.org/dc/terms/requires', '@type': '@id' };
const imports = { '@id': 'http://www.w3.org/2002/07/owl#imports', '@type': '@id' };
const versionInfo = { '@id': 'http://www.w3.org/2002/07/owl#versionInfo' };
const homepage = { '@id': 'http://xmlns.com/foaf/0.1/homepage' };
const name = { '@id': 'http://xmlns.com/foaf/0.1/name'};
const hasPart = { '@id': 'http://purl.org/dc/terms/hasPart', '@type': '@id' };
const preferredXMLNamespaceName = { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespaceName', '@type': 'http://www.w3.org/2001/XMLSchema#string' };
const preferredXMLNamespacePrefix = { '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespacePrefix', '@type': 'http://www.w3.org/2001/XMLSchema#string' };
const identifier = { '@id': 'http://purl.org/dc/terms/identifier', '@type': 'http://www.w3.org/2001/XMLSchema#string' };
const range = { '@id': 'http://www.w3.org/2000/01/rdf-schema#range', '@type': '@id' };
const subject = { '@id': 'http://purl.org/dc/terms/subject', '@type': '@id' };
const isPartOf = { '@id': 'http://purl.org/dc/terms/isPartOf', '@type': '@id' };
const isReferencedBy = { '@id': 'http://purl.org/dc/terms/isReferencedBy', '@type': '@id' };
const isAdminOf = { '@id': 'http://purl.org/dc/terms/isAdminOf', '@type': '@id' };
const equivalentClass = { '@id' : 'http://www.w3.org/2002/07/owl#equivalentClass', '@type' : '@id' };
const equivalentProperty = { '@id' : 'http://www.w3.org/2002/07/owl#equivalentProperty', '@type' : '@id' };
const constraint = { '@id': 'http://www.w3.org/ns/shacl#constraint', '@type': '@id' };
const or = { '@id': 'http://www.w3.org/ns/shacl#or', '@container': '@set' };
const and = { '@id': 'http://www.w3.org/ns/shacl#and', '@container': '@set' };
const foaf = { '@id': 'http://xmlns.com/foaf/0.1/', '@type': '@id'};

type Frame = {};

function addToContext(context: any, values: any): Frame {
  return Object.assign({}, context, values);
}

export function groupFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, comment, homepage})
  };
}

export function groupListFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, comment, homepage})
  };
}

export function modelFrame(data: any): Frame {
  const contextValues = {
    label,
    comment,
    title,
    example,
    prefLabel,
    references,
    requires,
    imports,
    hasPart,
    preferredXMLNamespaceName,
    preferredXMLNamespacePrefix,
    identifier,
    range,
    subClassOf,
    subPropertyOf,
    property,
    subject,
    datatype,
    predicate,
    valueShape,
    nodeKind,
    versionInfo,
    homepage,
    foaf
  };

  return {
    '@context': addToContext(data['@context'], contextValues),
    'isPartOf': {}
  };
}

export function usageFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, isDefinedBy, isReferencedBy}),
    'isReferencedBy':{}
  };
}

export function modelListFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, isPartOf, identifier}),
    'isPartOf': {}
  };
}

export function propertyFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, range, datatype, valueShape, modified, isDefinedBy, comment, predicate, index}),
    '@id': data['@id']
  };
}

export function predicateListFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, range, modified, isDefinedBy, comment}),
    'isDefinedBy': {}
  };
}

export function predicateFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, prefLabel, range, datatype, valueShape, modified, isDefinedBy, comment, subject, versionInfo, subPropertyOf, equivalentProperty}),
    'isDefinedBy': {}
  };
}

export function classFrame(data: any): Frame {
  const contextValues = {
    comment,
    label,
    prefLabel,
    subClassOf,
    property,
    modified,
    isDefinedBy,
    predicate,
    valueShape,
    nodeKind,
    example,
    datatype,
    subject,
    versionInfo,
    equivalentClass,
    index,
    minCount,
    maxCount,
    pattern,
    constraint,
    or,
    and
  };

  return {
    '@context': addToContext(data['@context'], contextValues),
    'isDefinedBy': {}
  };
}

export function classListFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, comment, isDefinedBy}),
    'isDefinedBy': {}
  };
}

export function conceptSuggestionFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, comment, inScheme}),
    'inScheme': {}
  };
}

export function fintoConceptFrame(data: any, id: Uri): Frame {
  /* Finto API fix */
  const value: any = null;
  const lang: any = null;

  return {
    '@context': addToContext(data['@context'], {prefLabel, comment, value, lang}),
    '@id': id
  };
}

export function userFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {name, isPartOf, isAdminOf, created, modified}),
    'name': {}
  };
}

export function requireFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, preferredXMLNamespaceName, preferredXMLNamespacePrefix}),
    'name': {}
  };
}

export function searchResultFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, comment}),
    'name': {}
  };
}

export function classVisualizationFrame(data: any): Frame {
  return {
    '@context': addToContext(data['@context'], {label, property, datatype, predicate, valueShape, index}),
    'property': {
      'predicate': {
        '@embed': false
      },
      'valueShape': {
        '@omitDefault': true,
        '@default': [],
        '@embed': false
      }
    }
  };
}
