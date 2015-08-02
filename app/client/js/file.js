// file things

Template.filelist.helpers({

  files: function() {
    return Files.find({}, {sort: {"title": 1}} )
  }

});

Template.filelist.events = {
  "click .new": function(e) {
    var id = Meteor.call('newFile');
    Session.set("document", id);
  }
};

Template.fileitem.helpers({
  current: function() {
    return Session.equals("document", this._id);
  }
});

Template.fileitem.events = {
  "click .file": function(e) {
    Session.set("document", this._id);
  }
};
