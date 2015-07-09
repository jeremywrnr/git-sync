// file things

Template.filelist.helpers({
  files: function() {
    return Files.find();
  }
});

Template.filelist.events = {
  "click .new": function() {
    return Files.insert({
      title: "untitled"
    }, function(err, id) {
      if (!id) { return; }
      return Session.set("document", id);
    });
  }
};

Template.fileitem.helpers({
  current: function() {
    return Session.equals("document", this._id);
  }
});

Template.fileitem.events = {
  "click .file": function(e) {
    e.preventDefault();
    return Session.set("document", this._id);
  }
};
