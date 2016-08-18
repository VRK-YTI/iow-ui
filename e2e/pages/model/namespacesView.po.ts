import { ModelPanelView } from './modelPanelView.po';
import { NamespaceModal } from './modal/namespaceModal.po';

export class NamespacesView extends ModelPanelView<NamespaceModal> {

  static nameColumn = 'Nimiavaruuden nimi';

  constructor() {
    super('imported-namespaces-view', NamespaceModal);
  }

  getRowByName(name: string) {
    return this.table.getRowByColumnText(NamespacesView.nameColumn, name);
  }
}
