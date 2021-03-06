import { ResetableService } from './resetableService';
import { IPromise, IQService } from 'angular';
import { InteractiveHelpModelService } from './helpModelService';
import { InteractiveHelpVisualizationService } from './helpVisualizationService';
import { InteractiveHelpUserService } from './helpUserService';
import { InteractiveHelpClassService } from './helpClassService';
import { InteractiveHelpVocabularyService } from './helpVocabularyService';
import { InteractiveHelpPredicateService } from './helpPredicateService';
import { InteractiveHelpValidatorService } from './helpValidatorService';

export class InteractiveHelpService implements ResetableService {

  private _open = false;
  private _closing = false;

  private helpServices: ResetableService[];

  constructor(private $q: IQService,
              private helpModelService: InteractiveHelpModelService,
              private helpVisualizationService: InteractiveHelpVisualizationService,
              private helpUserService: InteractiveHelpUserService,
              private helpClassService: InteractiveHelpClassService,
              private helpPredicateService: InteractiveHelpPredicateService,
              private helpVocabularyService: InteractiveHelpVocabularyService,
              private helpValidatorService: InteractiveHelpValidatorService) {
    'ngInject';

    this.helpServices = [
      helpModelService,
      helpVisualizationService,
      helpUserService,
      helpClassService,
      helpPredicateService,
      helpVocabularyService,
      helpValidatorService
    ];
  }

  isClosing() {
    return this._closing;
  }

  isOpen() {
    return this._open;
  }

  isClosed() {
    return !this.isOpen() && !this.isClosing();
  }

  open() {
    this._open = true;
    this._closing = false;
  }

  close() {
    this._open = false;
    this._closing = true;
    setTimeout(() => this._closing = false);
  }

  reset(): IPromise<any> {
    return this.$q.all(this.helpServices.map(service => service.reset()));
  }
}
