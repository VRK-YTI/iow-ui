import { confirm } from '../../modal/modalHelp.po';
import { modal, child, editableByTitle, input, editableFocus } from '../../../selectors';
import { createStory, createExpectedStateNextCondition } from '../../../contract';
import {
  initialInputValue, validInput,
  editableSelectMargin, editableMargin
} from '../../../utils';
import { filterForAddNewResult, selectAddNewResult } from '../../modal/searchModalHelp.po';
import gettextCatalog = angular.gettext.gettextCatalog;

const searchConceptModal = child(modal, '.search-concept');

export function filterForConceptSuggestionConcept(conceptName: string, gettextCatalog: gettextCatalog) {
  return filterForAddNewResult(searchConceptModal, conceptName, gettextCatalog);
}

export const addConceptSuggestionSearchResult = selectAddNewResult(searchConceptModal, 0, 'Select concept suggest creation');

const enterVocabularyElement = editableByTitle(modal, 'Vocabulary');
const enterVocabularyInputElement = input(enterVocabularyElement);
export const enterVocabulary = createStory({

  title: 'Vocabulary',
  popover: { element: enterVocabularyInputElement, position: 'left-down' },
  focus: { element: editableFocus(enterVocabularyElement), margin: editableSelectMargin },
  nextCondition: createExpectedStateNextCondition(validInput(enterVocabularyInputElement)),
  reversible: true
});

const enterLabelElement = editableByTitle(modal, 'Concept label');
const enterLabelInputElement = input(enterLabelElement);
export const enterLabel = createStory({

  title: 'Concept label',
  content: 'Concept label info',
  popover: { element: enterLabelInputElement, position: 'left-down' },
  focus: { element: editableFocus(enterLabelElement), margin: editableMargin },
  nextCondition: createExpectedStateNextCondition(validInput(enterLabelInputElement)),
  reversible: true
});

export function enterDefinition(initialValue: string, gettextCatalog: gettextCatalog) {

  const enterDefinitionElement = editableByTitle(modal, 'Definition');
  const enterDefinitionInputElement = input(enterDefinitionElement);

  return createStory({

    title: 'Definition',
    content: 'Definition info',
    popover: { element: enterDefinitionInputElement, position: 'left-down' },
    focus: { element: editableFocus(enterDefinitionElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterDefinitionInputElement)),
    initialize: initialInputValue(enterDefinitionInputElement, gettextCatalog.getString(initialValue)),
    reversible: true
  });
}

export function confirmConceptSelection(navigates: boolean) {
  return confirm(searchConceptModal, navigates);
}
