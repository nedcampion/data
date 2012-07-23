var get = Ember.get, set = Ember.set;

var errors;

module("DS.Errors", {
  setup: function() {
    errors = DS.Errors.create();
  },

  teardown: function() {
    errors.destroy();
    errors = null;
  }
});

test("add errors", function() {
  equal(get(errors, 'length'), 0, "has no errors");
  equal(get(errors, 'isEmpty'), true, "is empty");

  errors.add('name', 'is error');

  equal(get(errors, 'length'), 1, "has one error");

  errors.add('name', 'is another error');

  equal(get(errors, 'length'), 2, "has two errors");

  errors.add('name');

  equal(get(errors, 'length'), 3, "has three errors");

  errors.add('age', 'is also error');

  equal(get(errors, 'length'), 4, "has four errors");
  equal(get(errors, 'isEmpty'), false, "is not empty");
});

test("remove errors", function() {
  errors.add('name', 'is error');
  errors.add('name', 'is another error');
  errors.add('age', 'is also error');

  errors.remove('age');

  equal(get(errors, 'length'), 2, "has two errors");

  errors.remove('name');

  equal(get(errors, 'length'), 0, "has no errors");

  Ember.run.sync();
  equal(get(errors, 'isEmpty'), true, "is empty");

  errors.add('name', 'is error');
  errors.add('name', 'is another error');
  errors.add('age', 'is also error');

  errors.clear();

  equal(get(errors, 'length'), 0, "has no errors");
});

test("inspect errors", function() {
  errors.add('name', 'is error');
  errors.add('name', 'is another error');
  errors.add('age', 'is also error');
  errors.add('name');

  var nameErrors = get(errors, 'name'),
      ageErrors = get(errors, 'age'),
      fullMessages = get(errors, 'fullMessages');

  equal(errors.added('name'), true, 'we have errors for name');
  equal(errors.added('toto'), false, 'we do not have errors for toto');
  equal(errors.added('name', 'is error'), true, 'we have "is error" for name');
  equal(errors.added('name', 'is error not in errors'), false, 'we do not have this error');

  equal(get(nameErrors, 'length'), 3, "has three name errors");
  equal(get(ageErrors, 'length'), 1, "has one age error");

  equal(nameErrors.objectAt(0), 'is error', "first name error message is 'is error'");
  equal(nameErrors.objectAt(2), 'invalid', "last name error message is the default error");

  equal(errors.fullMessage('age', 'is error'), 'age is error', 'fullMessage method return default format for messages');

  equal(get(fullMessages, 'length'), 4, "has four full messages");

  equal(fullMessages.objectAt(0), 'name is error', "first name error message is 'is error'");
  equal(fullMessages.objectAt(2), 'name invalid', "last name error message is the default error");
  equal(fullMessages.objectAt(3), 'age is also error', "age error message is 'is also error'");

  errors.remove('name');

  ageErrors = get(errors, 'age');

  equal(get(ageErrors, 'length'), 1, "still has one age error");
});

test("iterate over errors", function(){
  expect(3);
  errors.add('name', 'is error');
  errors.add('name', 'is another error');
  errors.add('age', 'is also error');
  var index = 0;
  errors.forEach(function(message){
    if(index === 0){
      equal(message, 'name is error');
    }else if(index === 1){
      equal(message, 'name is another error');
    }else if(index === 2){
      equal(message, 'age is also error');
    }
    index += 1;
  });
});