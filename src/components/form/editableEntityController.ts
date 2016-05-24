import IFormController = angular.IFormController;
import ILogService = angular.ILogService;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { LanguageContext, EditableEntity } from '../../services/entities';
import { Uri } from '../../services/uri';
import { isModalCancel } from '../../utils/angular';

export interface EditableForm extends IFormController {
  editing: boolean;
}

export interface EditableScope extends IScope {
  form: EditableForm;
}

export type Rights = {
  edit(): boolean;
  remove(): boolean;
}

export abstract class EditableEntityController<T extends EditableEntity> {

  submitError: string;
  editableInEdit: T;
  persisting: boolean;

  constructor(private $scope: EditableScope, private $log: ILogService, protected deleteConfirmationModal: DeleteConfirmationModal, protected userService: UserService) {
    $scope.$watch(() => userService.isLoggedIn(), (isLoggedIn, wasLoggedIn) => {
      if (!isLoggedIn && wasLoggedIn) {
        this.cancelEditing();
      }
    });

    $scope.$watch(() => this.getEditable(), editable => this.select(editable));
  }

  abstract create(entity: T): IPromise<any>;
  abstract update(entity: T, oldId: Uri): IPromise<any>;
  abstract remove(entity: T): IPromise<any>;
  abstract rights(): Rights;
  abstract getEditable(): T;
  abstract setEditable(editable: T): void;
  abstract getContext(): LanguageContext;

  select(editable: T) {
    this.submitError = null;
    this.setEditable(editable);
    this.editableInEdit = editable ? <T> editable.clone() : null;

    if (editable && editable.unsaved) {
      this.edit();
    } else {
      this.cancelEditing();
    }
  }

  saveEdited() {
    const editable = this.getEditable();
    const editableInEdit = this.editableInEdit;
    this.$log.info(JSON.stringify(editableInEdit.serialize(), null, 2));
    this.persisting = true;
    (editable.unsaved ? this.create(editableInEdit) : this.update(editableInEdit, editable.id))
      .then(() => {
        this.select(editableInEdit);
        this.persisting = false;
      }, err => {
        if (err) {
          this.$log.error(err);
          this.submitError = err.data.errorMessage;
        }
        this.persisting = false;
      });
  }

  openDeleteConfirmationModal(): IPromise<void> {
    return this.deleteConfirmationModal.open(this.getEditable(), this.getContext());
  }

  removeEdited() {
    this.userService.ifStillLoggedIn(() => {
      const editable = this.getEditable();
      this.persisting = true;
      this.openDeleteConfirmationModal()
        .then(() => this.remove(editable))
        .then(() => {
          this.select(null);
          this.persisting = false;
        }, err => {
          if (!isModalCancel(err)) {
            this.$log.error(err);
            this.submitError = err.data.errorMessage;
          }
          this.persisting = false;
        });
    });
  }

  canRemove() {
    const editable = this.getEditable();
    return editable && !editable.unsaved && !this.isEditing() && this.rights().remove();
  }

  cancelEditing() {
    if (this.isEditing()) {
      if (this.submitError) {
        this.userService.updateLogin();
      }
      this.submitError = null;
      this.$scope.form.editing = false;
      this.$scope.form.$setPristine();
      const editable = this.getEditable();
      this.select(editable.unsaved ? null : editable);
    }
  }

  edit() {
    this.userService.ifStillLoggedIn(() => {
      this.$scope.form.editing = true;
    });
  }

  isEditing(): boolean {
    return this.$scope.form && this.$scope.form.editing;
  }

  canEdit(): boolean {
    return !this.isEditing() && this.rights().edit();
  }

  getRemoveText(): string {
    return 'Delete ' + this.getEditable().normalizedType;
  }
}
