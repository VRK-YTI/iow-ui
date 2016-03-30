import IAttributes = angular.IAttributes;
import IIntervalService = angular.IIntervalService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import IWindowService = angular.IWindowService;
import { LanguageService } from '../../services/languageService';
import { Class, Model, VisualizationClass, Property, Predicate } from '../../services/entities';
import * as _ from 'lodash';
import { isDefined } from '../../services/utils';
import { layout as colaLayout } from './colaLayout';
import { ModelService } from '../../services/modelService';
import { ChangeNotifier, ChangeListener, Show } from '../contracts';
import { module as mod }  from './module';
const joint = require('jointjs');


mod.directive('classVisualization', /* @ngInject */ ($timeout: ITimeoutService, $window: IWindowService) => {
  return {
    restrict: 'E',
    scope: {
      selection: '=',
      model: '=',
      changeNotifier: '='
    },
    template: `<div>
                <div class="button zoom-in" ng-mousedown="ctrl.zoomIn($event)" ng-mouseup="ctrl.zoomInEnded($event)"><i class="glyphicon glyphicon-zoom-in"></i></div>
                <div class="button zoom-out" ng-mousedown="ctrl.zoomOut($event)"  ng-mouseup="ctrl.zoomOutEnded($event)"><i class="glyphicon glyphicon-zoom-out"></i></div>
                <div class="button zoom-fit" ng-click="ctrl.fitToAllContent($event)"><i class="glyphicon glyphicon-fullscreen"></i></div>
                <div ng-show="ctrl.canFocus()" class="button zoom-focus" ng-click="ctrl.centerToSelectedClass($event)"><i class="glyphicon glyphicon-screenshot"></i></div>
                <div ng-show="ctrl.canFocus()" class="selection-focus">
                  <div class="button focus-in" ng-click="ctrl.focusIn($event)"><i class="glyphicon glyphicon-eye-open"></i></div>
                  <div class="button focus-indicator">{{ctrl.renderSelectionFocus()}}</div>
                  <div class="button focus-out" ng-click="ctrl.focusOut($event)"><i class="glyphicon glyphicon-eye-close"></i></div>
                </div>
                <ajax-loading-indicator class="loading-indicator" ng-show="ctrl.loading"></ajax-loading-indicator>
               </div>`,
    bindToController: true,
    controllerAs: 'ctrl',
    require: 'classVisualization',
    link($scope: IScope, element: JQuery, attributes: IAttributes, controller: ClassVisualizationController) {

      element.addClass('visualization-container');

      const {graph, paper} = createGraph(element);

      registerZoomAndPan($window, paper);

      paper.on('cell:pointermove', (cellView: joint.dia.CellView) => {
        const cell = cellView.model;
        if (cell instanceof joint.dia.Element) {
          adjustElementLinks(graph, paper, <joint.dia.Element> cell);
        }
      });

      controller.graph = graph;
      controller.paper = paper;

      const intervalHandle = window.setInterval(() => {
        const xd = paper.options.width - element.width();
        const yd = paper.options.height - element.height();

        if (xd || yd) {
          paper.setDimensions(element.width(), element.height());
          moveOrigin(paper, xd / 2, yd / 2);
          controller.dimensionChangeInProgress = false;
        }
      }, 200);

      $scope.$on('$destroy', () => window.clearInterval(intervalHandle));

    },
    controller: ClassVisualizationController
  };
});

const zIndexAssociation = 5;
const zIndexClass = 10;

class ClassVisualizationController implements ChangeListener<Class|Predicate> {

  selection: Class|Predicate;
  selectionFocus: number = 1;

  model: Model;
  changeNotifier: ChangeNotifier<Class|Predicate>;

  graph: joint.dia.Graph;
  paper: joint.dia.Paper;
  loading: boolean;

  zoomInHandle: number;
  zoomOutHandle: number;

  dimensionChangeInProgress: boolean = true;

  /* @ngInject */
  constructor(private $scope: IScope, private $timeout: ITimeoutService, private modelService: ModelService, private languageService: LanguageService) {

    this.changeNotifier.addListener(this);

    $scope.$watch(() => this.model, () => this.refresh());
    $scope.$watch(() => this.selection, newSelection => this.focus());
    $scope.$watch(() => this.selectionFocus, focus => this.focus());
  }

  refresh() {
    if (this.model) {
      this.loading = true;
      // HACK: IE9 SVG rendering caused "unexpected call to method or property access " without this timeout hack
      this.$timeout(() => {
        (<Promise<any>> this.modelService.getVisualizationData(this.model))
          .then(data => this.initGraph(data))
          .then(() => this.loading = false);
      });
    }
  }

  initGraph(visualizationData: VisualizationClass[]) {
    this.graph.clear();
    const showCardinality = this.model.isOfType('profile');
    return createCells(this.$scope, this.languageService, this.graph, visualizationData, showCardinality)
      .then(() => layoutGraph(this.graph, this.paper))
      .then(() => this.focus());
  }

  onEdit(newItem: Class|Predicate, oldItem: Class|Predicate) {
    if (newItem instanceof Class) {
      this.refresh();
    }
  }

  onDelete(item: Class|Predicate) {
    if (item instanceof Class) {
      this.refresh();
    }
  }

  onAssign(item: Class|Predicate) {
    if (item instanceof Class) {
      this.refresh();
    }
  }

  onResize(show: Show) {
    this.dimensionChangeInProgress = true;
  }

  canFocus() {
    return this.selection instanceof Class;
  }

  renderSelectionFocus() {
    if (this.selectionFocus > 3) {
      return '*';
    } else {
      return this.selectionFocus.toString();
    }
  }

  focusIn(event: JQueryEventObject) {
    if (this.selectionFocus < 4) {
      this.selectionFocus++;
    }
  }

  focusOut(event: JQueryEventObject) {
    if (this.selectionFocus > 1) {
      this.selectionFocus--;
    }
  }

  zoomIn(event: JQueryEventObject) {
    event.stopPropagation();
    this.zoomInHandle = window.setInterval(() => {
      scale(this.paper, 0.01);
    }, 10);
  }

  zoomInEnded(event: JQueryEventObject) {
    window.clearInterval(this.zoomInHandle);
  }

  zoomOut(event: JQueryEventObject) {
    event.stopPropagation();
    this.zoomOutHandle = window.setInterval(() => {
      scale(this.paper, -0.01);
    }, 10);
  }

  zoomOutEnded(event: JQueryEventObject) {
    event.stopPropagation();
    window.clearInterval(this.zoomOutHandle);
  }

  fitToAllContent(event?: JQueryEventObject) {
    if (event) {
      event.stopPropagation();
    }

    if (this.dimensionChangeInProgress) {
      setTimeout(() => this.fitToAllContent(), 200);
    } else {
      scaleToFit(this.paper);
    }
  }

  centerToSelectedClass(event?: JQueryEventObject) {
    if (event) {
      event.stopPropagation();
    }

    const element = this.getClassElement(this.selection);

    if (element) {
      this.centerToElement(element);
    }
  }

  centerToElement(element: joint.dia.Element) {
    const scale = 0.8;
    const bbox = element.getBBox();
    const x = (this.paper.options.width / 2) - (bbox.x + bbox.width / 2) * scale;
    const y = (this.paper.options.height / 2) - (bbox.y + bbox.height / 2) * scale;

    this.paper.scale(scale);
    this.paper.setOrigin(x, y);
  }

  private isInfiniteFocus() {
    return !this.selection || this.selectionFocus > 3;
  }

  focus() {
    const that = this;
    const backgroundClass = 'background';
    const selectedClass = 'selected';

    function resetFocusOnAllCells() {
      for (const cell of that.graph.getCells()) {
        const jqueryElement = joint.V(that.paper.findViewByModel(cell).el);

        jqueryElement.removeClass(selectedClass);

        if (that.isInfiniteFocus()) {
          jqueryElement.removeClass(backgroundClass);
        } else {
          jqueryElement.addClass(backgroundClass);
        }
      }
    }

    function applyFocus(e: joint.dia.Element, depth: number) {
      if (depth > 0) {
        joint.V(that.paper.findViewByModel(e).el).removeClass(backgroundClass);

        for (const association of that.graph.getConnectedLinks(<joint.dia.Cell> e)) {
          joint.V(that.paper.findViewByModel(association).el).removeClass(backgroundClass);
        }

        for (const klass of that.graph.getNeighbors(e)) {
          joint.V(that.paper.findViewByModel(klass).el).removeClass(backgroundClass);
          applyFocus(klass, depth - 1);
        }
      }
    }

    resetFocusOnAllCells();
    const element = this.getClassElement(this.selection);

    if (element) {
      if (!this.isInfiniteFocus()) {
        applyFocus(element, this.selectionFocus);
      }

      joint.V(that.paper.findViewByModel(element).el).addClass(selectedClass);
    }

    this.fitToAllContent();
  }

  private getClassElement(classOrPredicate: Class|Predicate): joint.dia.Element {
    if (classOrPredicate instanceof Class) {
      const cell = this.graph.getCell(classOrPredicate.id.uri);
      if (cell) {
        if (cell.isLink()) {
          throw new Error('Cell must be an element');
        } else {
          return <joint.dia.Element> cell;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
}

function createGraph(element: JQuery): {graph: joint.dia.Graph, paper: joint.dia.Paper} {

  const graph = new joint.dia.Graph;
  const paper = new joint.dia.Paper({
    el: element,
    width: element.width() || 100,
    height: element.height() || 100,
    model: graph,
    linkPinning: false,
    async: true
  });

  return {graph, paper};
}


function moveOrigin(paper: joint.dia.Paper, dx: number, dy: number) {
  const oldOrigin = paper.options.origin;
  paper.setOrigin(oldOrigin.x - dx, oldOrigin.y - dy);
}

function getScale(paper: joint.dia.Paper) {
  const viewport = joint.V(paper.viewport);
  return viewport.scale().sx;
}

function scale(paper: joint.dia.Paper, scaleDiff: number, x?: number, y?: number) {
  const scale = getScale(paper);
  const newScale = scale + scaleDiff;

  if (scale !== newScale && newScale >= 0.1 && newScale <= 3) {
    const scaleRatio = newScale / scale;

    const actualX = x || paper.options.width / 2;
    const actualY = y || paper.options.height / 2;

    const tx = scaleRatio * (paper.options.origin.x - actualX) + actualX;
    const ty = scaleRatio * (paper.options.origin.y - actualY) + actualY;

    paper.setOrigin(tx, ty);
    paper.scale(newScale, newScale);
  }
}

function registerZoomAndPan($window: IWindowService, paper: joint.dia.Paper) {
  const window = angular.element($window);
  let drag: {x: number, y: number};
  let mouse: {x: number, y: number};

  paper.on('blank:pointerdown', () => drag = mouse);
  window.mouseup(() => drag = null);
  window.mousemove(event => {
    mouse = {x: event.offsetX, y: event.offsetY};
    if (drag) {
      moveOrigin(paper, drag.x - mouse.x, drag.y - mouse.y);
      drag = mouse;
    }
  });

  jQuery(paper.$el).mousewheel(event => {
    event.preventDefault();
    scale(paper, (event.deltaY * event.deltaFactor / 500), event.offsetX, event.offsetY);
  });
}


function scaleToFit(paper: joint.dia.Paper) {
  paper.scaleContentToFit({
    padding: 45,
    minScaleX: 0.05,
    minScaleY: 0.05,
    maxScaleX: 2,
    maxScaleY: 2
  });
}

function layoutGraph(graph: joint.dia.Graph, paper: joint.dia.Paper) {
  return colaLayout(graph).then(() => adjustGraphLinks(graph, paper));
}

function forEachInBackground<T>(items: T[], callback: (item: T) => void): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    function forItemAtIndex(index: number) {
      window.requestAnimFrame(() => {
        if (index < items.length) {
          const item = items[index];
          callback(item);
          forItemAtIndex(++index);
        } else {
          resolve(true);
        }
      });
    }

    forItemAtIndex(0);
  });
}

function createCells($scope: IScope, languageService: LanguageService, graph: joint.dia.Graph, classes: VisualizationClass[], showCardinality: boolean) {

  const associations: {klass: VisualizationClass, association: Property}[] = [];
  const classIds = new Set<string>();

  for (const klass of classes) {
    classIds.add(klass.id.uri);
  }

  const addClasses = () => {
    return forEachInBackground(classes, klass => {
      const attributes: Property[] = [];

      for (const property of klass.properties) {
        if (property.hasAssociationTarget() && classIds.has(property.valueClass.uri)) {
          associations.push({klass: klass, association: property});
        } else {
          attributes.push(property);
        }
      }

      createClass($scope, languageService, graph, klass, attributes, showCardinality);
    });
  };

  const addAssociations = () => {
    return forEachInBackground(associations, association => {
      createAssociation($scope, languageService, graph, association, showCardinality);
    });
  };

  return addClasses().then(() => addAssociations());
}

function formatCardinality(property: Property) {
  const min = property.minCount;
  const max = property.maxCount;

  if (!isDefined(min) && !isDefined(max)) {
    return '*';
  } else if (min === max) {
    return min.toString();
  } else {
    return `${min || '0'}..${max || '*'}`;
  }
}

function createClass($scope: IScope, languageService: LanguageService, graph: joint.dia.Graph, klass: VisualizationClass, properties: Property[], showCardinality: boolean) {

  function getName() {
    return languageService.translate(klass.label);
  }

  function getPropertyNames() {
    function propertyAsString(property: Property): string {
      const name = languageService.translate(property.label);
      const range = property.hasAssociationTarget() ? property.valueClass.compact : property.dataType;
      const cardinality = formatCardinality(property);
      return `- ${name} : ${range}` + (showCardinality ? ` [${cardinality}]` : '');
    }

    return _.map(_.sortBy(properties, property => property.index), propertyAsString);
  }

  function size(propertyNames: string[]) {
    const width = _.max([_.max(_.map(propertyNames, name => name.length)) * 6.5, 150]);
    const height = 12 * propertyNames.length + 35;

    return { width, height };
  }

  const propertyNames = getPropertyNames();

  const classCell: any = new joint.shapes.uml.Class({
    id: klass.id.uri,
    size: size(propertyNames),
    name: getName(),
    attributes: propertyNames,
    attrs: {
      '.uml-class-name-text': {
        'ref': '.uml-class-name-rect', 'ref-y': 0.6, 'ref-x': 0.5, 'text-anchor': 'middle', 'y-alignment': 'middle'
      }
    },
    z: zIndexClass
  });

  $scope.$watch(() => languageService.modelLanguage, () => {
    const newPropertyNames = getPropertyNames();
    classCell.prop('name', getName());
    classCell.prop('attributes', newPropertyNames);
    classCell.prop('size', size(newPropertyNames));
  });

  graph.addCell(classCell);
}

function createAssociation($scope: IScope, languageService: LanguageService, graph: joint.dia.Graph, data: {klass: VisualizationClass, association: Property}, showCardinality: boolean) {

  function getName() {
    return languageService.translate(data.association.label);
  }

  const associationCell: any = new joint.dia.Link({
    source: { id: data.klass.id.uri },
    target: { id: data.association.valueClass.uri },
    connector: { name: 'normal' },
    attrs: {
      '.marker-target': {
        d: 'M 10 0 L 0 5 L 10 10 L 3 5 z'
      }
    },
    labels: [
      { position: 0.5, attrs: { text: { text: getName() } } },
      { position: .9, attrs: { text: { text: showCardinality ? formatCardinality(data.association) : ''} } }
    ],
    z: zIndexAssociation
  });

  $scope.$watch(() => languageService.modelLanguage, () => {
    associationCell.prop('labels/0/attrs/text/text', getName());
    if (showCardinality) {
      associationCell.prop('labels/1/attrs/text/text', formatCardinality(data.association));
    }
  });

  graph.addCell(associationCell);
}


function isSiblingLink(lhs: joint.dia.Link, rhs: joint.dia.Link) {
  const lhsSource = lhs.get('source').id;
  const lhsTarget = lhs.get('target').id;
  const rhsSource = rhs.get('source').id;
  const rhsTarget = rhs.get('target').id;

  return (lhsSource === rhsSource && lhsTarget === rhsTarget) || (lhsSource === rhsTarget && lhsTarget === rhsSource);
}

function isLoop(link: joint.dia.Link) {
  return link.get('source').id === link.get('target').id;
}

function adjustGraphLinks(graph: joint.dia.Graph, paper: joint.dia.Paper) {
  for (const link of graph.getLinks()) {
    adjustLink(graph, paper, link);
  }
}

function adjustElementLinks(graph: joint.dia.Graph, paper: joint.dia.Paper, element: joint.dia.Element) {
  for (const link of graph.getConnectedLinks(<joint.dia.Cell> element)) {
    adjustLink(graph, paper, link);
  }
}

function adjustLink(graph: joint.dia.Graph, paper: joint.dia.Paper, link: joint.dia.Link) {

  const srcId = link.get('source').id;
  const trgId = link.get('target').id;

  if (srcId && trgId) {

    const siblings = _.filter(graph.getLinks(), _.partial(isSiblingLink, link));
    const srcCenter = (<joint.dia.Element> graph.getCell(srcId)).getBBox().center();
    const trgCenter = (<joint.dia.Element> graph.getCell(trgId)).getBBox().center();
    const midPoint = joint.g.line(srcCenter, trgCenter).midpoint();
    const theta = srcCenter.theta(trgCenter);

    const gapBetweenSiblings = 25;

    if (isLoop(link)) {
      for (let i = 0; i < siblings.length; i++) {
        recurseLink(paper, siblings[i], i);
      }
    } else {
      if (siblings.length === 1) {
        link.unset('vertices');
        link.prop('connector', { name: 'normal' });
      } else {
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          const offset = gapBetweenSiblings * Math.ceil((i + 1) / 2);
          const sign = i % 2 ? 1 : -1;
          const angle = joint.g.toRad(theta + sign * 90);
          const vertex = joint.g.point.fromPolar(offset, angle, midPoint);

          sibling.prop('connector', { name: 'smooth' });
          sibling.set('vertices', [vertex]);
        }
      }
    }
  }
};

function recurseLink(paper: joint.dia.Paper, link: joint.dia.Link, siblingIndex: number) {

  const bbox = joint.V(paper.findViewByModel(link.get('source').id).el).bbox(false, paper.viewport);
  const left = bbox.width / 2;
  const top = bbox.height / 2;
  const centre = joint.g.point(bbox.x + left, bbox.y + top);

  const position = siblingIndex % 4;

  function resolveSign() {
    switch (position) {
      case 0:
        return { x: 1,  y: 1};
      case 1:
        return { x: -1, y: 1};
      case 2:
        return { x: 1,  y: -1};
      case 3:
        return { x: -1, y: -1};
      default:
        throw new Error('Unsupported position: ' + position);
    }
  }

  const offset = 50;
  const sign = resolveSign();
  const scale = Math.floor(siblingIndex / 4) + 1;

  link.set('vertices', [
    joint.g.point(centre).offset(0, sign.y * (top + offset * scale)),
    joint.g.point(centre).offset(sign.x * (left + offset * scale), sign.y * (top + offset * scale)),
    joint.g.point(centre).offset(sign.x * (left + offset * scale), 0)
  ]);
}
