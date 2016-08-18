import { Modal } from './modal.po';
import { SubmitButton } from './component/submitButton.po';

export class SearchModal extends Modal {

  searchElement = this.element.element(by.model('ctrl.searchText'));
  searchResults = this.element.$('.search-results');
  confirmButton = new SubmitButton(this.element.$('modal-buttons button.confirm'));

  search(text: string) {
    this.searchElement.sendKeys(text);
  }

  findResultElementByName(name: string) {
    return this.searchResults.element(by.cssContainingText('h5', name));
  }

  selectResult(name: string) {
    return browser.wait(protractor.until.elementLocated(by.css('search-results')))
      .then(() => this.findResultElementByName(name).click());
  }

  confirm() {
    this.confirmButton.submit();
  }
}