import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model, Uri } from '../../services/entities';
import { isValidUri } from './validators';

import { module as mod }  from './module';

mod.directive('uriInput', /* @ngInjedt */ (gettextCatalog: gettextCatalog) => {
  return {
    scope: {
      model: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: UriInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

      if (!attributes['placeholder']) {
        element.attr('placeholder', gettextCatalog.getString('Write identifier'));
      }

      modelController.$parsers.push((viewValue: string) => {
        return viewValue === '' ? null : new Uri(viewValue, $scope.model.context);
      });

      modelController.$formatters.push((value: Uri) => {
        if (!value) {
          return '';
        } else {
          return value.compact;
        }
      });

      modelController.$validators['xsd:anyURI'] = value => {
        return !value || isValidUri(value.uri);
      };

      modelController.$validators['id'] = value => {
        return !value || value.hasResolvablePrefix();
      };
    }
  };
});

interface UriInputScope extends IScope {
  model: Model;
}
