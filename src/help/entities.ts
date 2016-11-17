import { modelIdFromPrefix } from '../../e2e/util/resource';
const palveluNimiId = '6cfbd054-2bfc-4e92-8642-477b035f59ee';
const palveluKuvausId = 'fe884237-f6e2-44ea-ac97-231516da4770';

export const exampleImportedLibrary = {
  prefix: 'jhs',
  namespaceId: 'http://iow.csc.fi/ns/jhs'
};

export const exampleLibrary = {
  prefix: 'sea',
  name: 'Merenkulun tietokomponentit',
  comment: 'Merenkulkuun liittyvät tietosisällöt',
  importedLibrary: exampleImportedLibrary,
  newClass: {
    name: 'Vene',
    comment: 'Vedessä kulkeva alus, joka on laivaa pienempi',
    property: {
      nameAttribute: {
        prefix: exampleImportedLibrary.prefix,
        namespaceId: exampleImportedLibrary.namespaceId,
        name: 'Nimi'
      },
      passengersAttribute: {
        searchName: 'Matkustajien lukumäärä',
        name: 'Matkustajien lukumäärä',
        comment: 'Matkustajien lukumäärä'
      },
      association: {
        searchName: 'Omistaja',
        name: 'Omistaja',
        conceptId: 'http://jhsmeta.fi/skos/J197',
        target: {
          namespaceId: exampleImportedLibrary.namespaceId,
          name: 'Henkilö'
        }
      }
    }
  },
  assignedClass: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Henkilö'
  },
  assignedClass2: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Yhteystiedot'
  },
  assignedClass3: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Osoite'
  }
};

export const exampleProfile = {
  prefix: 'plv',
  name: 'Palveluprofiili',
  importedLibrary: exampleImportedLibrary,
  newClass: {
    name: 'Tuote',
    comment: 'Asia joka tuotetaan',
    property: {
      attribute: {
        prefix: exampleImportedLibrary.prefix,
        namespaceId: exampleImportedLibrary.namespaceId,
        name: 'Nimi'
      },
      association: {
        searchName: 'Tuotetaan',
        name: 'Tuotetaan palvelussa',
        comment: 'tapahtumaketju joka toteuttaa jotain',
        target: {
          namespaceId: modelIdFromPrefix('plv'),
          name: 'Palvelu'
        }
      }
    }
  },
  specializedClass: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Palvelu',
    properties: [palveluNimiId, palveluKuvausId]
  }
};
