import IFilterService = angular.IFilterService;
import gettextCatalog = angular.gettext.gettextCatalog;
import Moment = moment.Moment;
import * as _ from 'lodash';
import { ConfirmationModal } from './confirmationModal';
import { DeleteConfirmationModal } from './deleteConfirmationModal';
import { HistoryModal } from './historyModal';
import { LanguageService } from '../../services/languageService';
import { Localizable, LanguageContext } from '../../services/entities';
import { module as mod }  from './module';
export default mod.name;

import './accordion';
import './accordionChevron';
import './ajaxLoadingIndicator';
import './ajaxLoadingIndicatorSmall';
import './export';
import './float';
import './history';
import './keyControl';
import './keyControlItem';
import './modalTemplate';
import './searchResults';

mod.service('confirmationModal', ConfirmationModal);
mod.service('deleteConfirmationModal', DeleteConfirmationModal);
mod.service('historyModal', HistoryModal);

mod.filter('translateValue', /* @ngInject */ (languageService: LanguageService) => {
  return (input: Localizable, context?: LanguageContext) => input ? languageService.translate(input, context) : '';
});

mod.filter('translateLabel', /* @ngInject */ (translateValueFilter: any) => {
  return (input: { label: Localizable }, context?: LanguageContext) => input ? translateValueFilter(input.label, context) : '';
});

mod.filter('capitalize', function() {
  return function(input: string) {
    return _.capitalize(input);
  };
});

mod.filter('trustAsHtml', /* @ngInject */ ($sce: angular.ISCEService) => {
  return (text: string) => $sce.trustAsHtml(text);
});

mod.filter('localizedDate', /* @ngInject */ (gettextCatalog: gettextCatalog) => {
  return (moment: Moment) => {
    if (moment) {
      return moment.format(gettextCatalog.getString('date format'));
    } else {
      return null;
    }
  };
});
