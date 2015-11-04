const _ = require('lodash');
const jsonld = require('jsonld');
const frames = require('./frames');
const contextUtils = require('./contextUtils');

module.exports = function predicateService($http, $q) {
  'ngInject';

  let unsavedPredicates = {};

  return {
    addUnsavedPredicate(predicate, context) {
      const predicateId = contextUtils.withFullIRI(context, predicate['@graph'][0]['@id']);
      _.extend(predicate['@context'], context);
      unsavedPredicates[predicateId] = predicate;
    },
    createUnsavedPredicates() {
      return $q.all(_.map(unsavedPredicates, (predicate, predicateId) => this.createPredicate(predicate, predicateId)))
        .then(this.clearUnsavedPredicates);
    },
    clearUnsavedPredicates() {
      unsavedPredicates = {};
    },
    getAllPredicates() {
      return $http.get('/api/rest/predicate')
        .then(response => {
          const frame = frames.predicateSearchFrame(response.data);
          return jsonld.promises.frame(response.data, frame);
        });
    },
    getPredicateById(id, userFrame = 'predicateFrame') {
      const unsaved = unsavedPredicates[id];

      function frame(data) {
        return jsonld.promises.frame(data, frames[userFrame](data));
      }

      if (unsaved) {
        return $q.when(frame(unsaved).then(framed => _.extend(framed, {unsaved: true})));
      } else {
        return $http.get('/api/rest/predicate', {params: {id}}).then(response => frame(response.data));
      }
    },
    getPredicatesForModel(model) {
      return $http.get('/api/rest/predicate', {params: {model}}).then(response => {
        const attributeFrame = frames.attributeFrame(response.data);
        const associationFrame = frames.associationFrame(response.data);
        return $q.all({
          attributes: jsonld.promises.frame(response.data, attributeFrame),
          associations: jsonld.promises.frame(response.data, associationFrame)
        });
      });
    },
    updatePredicate(predicate, id, originalId) {
      const requestParams = {
        id,
        model: predicate.isDefinedBy
      };
      if (id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/predicate', predicate, {params: requestParams});
    },
    createPredicate(predicate, id) {
      const requestParams = {
        id,
        model: predicate.isDefinedBy || predicate['@graph'][0].isDefinedBy
      };
      return $http.put('/api/rest/predicate', predicate, {params: requestParams}).then(() => delete unsavedPredicates[id]);
    },
    assignPredicateToModel(predicateId, modelId) {
      const requestParams = {
        id: predicateId,
        model: modelId
      };
      return $http.post('/api/rest/predicate', undefined, {params: requestParams});
    }
  };
};
