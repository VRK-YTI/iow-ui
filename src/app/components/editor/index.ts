import { ChoosePredicateTypeModal } from './choosePredicateTypeModal';
import { CopyPredicateModal } from './copyPredicateModal';
import { SearchConceptModal } from './searchConceptModal';
import { SearchClassModal } from './searchClassModal';
import { SearchPredicateModal } from './searchPredicateModal';
import { AddPropertiesFromClassModal } from './addPropertiesFromClassModal';
import { module as mod } from './module';
export { module } from './module';

import './classForm';
import './classView';
import './definedBy';
import './selectionFloatSizeAdjuster';
import './uriSelect';
import './editableConstraint';
import './editableMultiple';
import './editableMultipleUriSelect';
import './editableMultipleDataTypeInput';
import './editableMultipleLanguageSelect';
import './editableReferenceDataSelect';
import './predicateForm';
import './predicateView';
import './propertyView';
import './propertyPredicateView';
import './editableRangeSelect';
import './selectionView';
import './subjectView';
import './visualizationView';

mod.service('choosePredicateTypeModal', ChoosePredicateTypeModal);
mod.service('copyPredicateModal', CopyPredicateModal);
mod.service('addPropertiesFromClassModal', AddPropertiesFromClassModal);
mod.service('searchClassModal', SearchClassModal);
mod.service('searchConceptModal', SearchConceptModal);
mod.service('searchPredicateModal', SearchPredicateModal);
