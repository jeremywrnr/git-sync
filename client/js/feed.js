// messages and events feed

var linkify = Codepilot.linkify;

Template.chatter.events({

  'keydown input#message': function(e) {
    if (e.which === 13) { // 'enter' keycode recieved
      var msg = $('input#message')[0];
      Meteor.call('addMessage', $.trim(msg.value));
      msg.value = ''; // purge the old message
    }
  }

});


Template.messages.helpers({
  messageCount: function() { // count feed items
    return Messages.find({}).count();
  },

  messages: function() { // linkify and return feed items
    return Messages.find({}, {sort: {time: 1}});
  },
});


// scroll down on new messages
Template.message.onRendered(function () {
  var newFeedCount = Messages.find({}).count();
  var feed = $("#feed")[0];

  if ((! Session.equals('feedCount', newFeedCount)) && feed) {
    $('#feed').stop().animate({ scrollTop: feed.scrollHeight }, 500);
    Session.set('feedCount', newFeedCount);
  }
});

Template.message.helpers({
  linked: function() { // return local message time
    return linkify(this.message);
  },

  timestamp: function() { // return local message time
    var msgdate = new Date(this.time);
    return msgdate.toLocaleTimeString().toLowerCase();
  },

  datestamp: function() { // return local message date
    var msgdate = new Date(this.time);
    return msgdate.toLocaleDateString();
  }
});
