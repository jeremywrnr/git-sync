// file things

Template.userfiles.helpers({

  files: function() {
    return Files.find({}, {sort: {'title': 1}} )
  }

});

Template.userfiles.events({

  'click .new': function() {
    var id = Meteor.call('newFile');
    Session.set('document', id);
  }

});



// individual files

Template.fileitem.helpers({

  current: function() {
    return Session.equals('document', this._id);
  }

});

Template.fileitem.events({

  'click .file': function() {
    Session.set('document', this._id);
  }

});
