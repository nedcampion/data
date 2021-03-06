require("ember-data/system/record_arrays/record_array");
require("ember-data/system/record_arrays/many_array_states");

var get = Ember.get, set = Ember.set, setPath = Ember.setPath;

DS.ManyArray = DS.RecordArray.extend({
  init: function() {
    set(this, 'stateManager', DS.ManyArrayStateManager.create({ manyArray: this }));

    return this._super();
  },

  parentRecord: null,

  isDirty: Ember.computed(function() {
    return get(this, 'stateManager.currentState.isDirty');
  }).property('stateManager.currentState').cacheable(),

  isLoaded: Ember.computed(function() {
    return get(this, 'stateManager.currentState.isLoaded');
  }).property('stateManager.currentState').cacheable(),

  send: function(event, context) {
    this.get('stateManager').send(event, context);
  },

  fetch: function() {
    var clientIds = get(this, 'content'),
        store = get(this, 'store'),
        type = get(this, 'type');

    store.fetchUnloadedClientIds(type, clientIds);
  },

  // Overrides Ember.Array's replace method to implement
  replaceContent: function(index, removed, added) {
    var parentRecord = get(this, 'parentRecord');
    var pendingParent = parentRecord && !get(parentRecord, 'id');
    var stateManager = get(this, 'stateManager');

    // Map the array of record objects into an array of  client ids.
    added = added.map(function(record) {
      Ember.assert("You can only add records of " + (get(this, 'type') && get(this, 'type').toString()) + " to this association.", !get(this, 'type') || (get(this, 'type') === record.constructor));

      // If the record to which this many array belongs does not yet
      // have an id, notify the newly-added record that it must wait
      // for the parent to receive an id before the child can be
      // saved.
      if (pendingParent) {
        record.send('waitingOn', parentRecord);
      }

      var oldParent = this.assignInverse(record, parentRecord);

      record.get('transaction')
        .relationshipBecameDirty(record, oldParent, parentRecord);

      stateManager.send('recordWasAdded', record);

      return record.get('clientId');
    }, this);

    var store = this.store;

    var len = index+removed, record;
    for (var i = index; i < len; i++) {
      // TODO: null out inverse FK
      record = this.objectAt(i);
      var oldParent = this.assignInverse(record, parentRecord, true);

      record.get('transaction')
        .relationshipBecameDirty(record, parentRecord, null);

      // If we put the child record into a pending state because
      // we were waiting on the parent record to get an id, we
      // can tell the child it no longer needs to wait.
      if (pendingParent) {
        record.send('doneWaitingOn', parentRecord);
      }

      stateManager.send('recordWasAdded', record);
    }

    this._super(index, removed, added);
  },

  assignInverse: function(record, parentRecord, remove) {
    var associationMap = get(record.constructor, 'associations'),
        possibleAssociations = associationMap.get(parentRecord.constructor),
        possible, actual, oldParent;

    if (!possibleAssociations) { return; }

    for (var i = 0, l = possibleAssociations.length; i < l; i++) {
      possible = possibleAssociations[i];

      if (possible.kind === 'belongsTo') {
        actual = possible;
        break;
      }
    }

    if (actual) {
      oldParent = get(record, actual.name);
      set(record, actual.name, remove ? null : parentRecord);
      return oldParent;
    }
  },

  // Create a child record within the parentRecord
  createRecord: function(hash, transaction) {
    var parentRecord = get(this, 'parentRecord'),
        store = get(parentRecord, 'store'),
        type = get(this, 'type'),
        record;

    transaction = transaction || get(parentRecord, 'transaction');

    record = store.createRecord.call(store, type, hash, transaction);
    this.pushObject(record);

    return record;
  }
});
