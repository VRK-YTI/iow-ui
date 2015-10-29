const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function attributeView($log) {
  'ngInject';
  return {
    scope: {
      id: '='
    },
    restrict: 'E',
    template: require('./templates/attributeView.html'),
    require: '^ngController',
    link($scope, element, attributes, modelController) {
      const controller = $scope.ctrl;
      modelController.registerView(controller);
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope, predicateService, modelLanguage, userService) {
      'ngInject';

      let context;
      let originalId;
      const vm = this;

      vm.loading = true;
      vm.updateAttribute = updateAttribute;
      vm.resetModel = resetModel;
      // view contract
      vm.isEditing = isEditing;

      $scope.$watch('ctrl.id', id => fetchPredicate(id));
      $scope.$watch(modelLanguage.getLanguage, cancelEditing);
      $scope.$watch(userService.isLoggedIn, cancelEditing);

      function fetchPredicate(id) {
        vm.loading = true;
        predicateService.getPredicateById(id, 'attributeFrame').then(data => {
          cancelEditing();
          context = data['@context'];
          originalId = id;
          vm.attribute = data['@graph'][0];
        }).finally(() => vm.loading = false);
      }

      function updateAttribute() {
        const ld = _.chain(vm.attribute)
          .clone()
          .assign({'@context': context})
          .value();

        const id = contextUtils.withFullIRI(context, vm.attribute['@id']);

        $log.info(JSON.stringify(ld, null, 2));

        return predicateService.updatePredicate(ld, id, originalId).then(() => {
          originalId = id;
          vm.id = id;
          $scope.modelController.reload();
        });
      }

      function resetModel() {
        fetchPredicate(originalId);
      }

      function isEditing() {
        return $scope.formController.visible();
      }

      function cancelEditing() {
        $scope.formController.cancel();
      }
    }
  };
};
