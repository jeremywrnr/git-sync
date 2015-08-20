// common (server and client) methods

// maybe need this in future:
// if (! Meteor.userId()) throw new Meteor.Error('not-authorized');

Meteor.methods({

  //////////////////
  // FEED MANAGEMENT
  //////////////////

  addMessage: function (msg) { // add a generic message to the activity feed
    if (msg.length) {
      Messages.insert({
        owner: Meteor.userId(),
        repo: Meteor.user().profile.repo,
        name: Meteor.user().profile.login,
        message: msg,
        time: Date.now()
      });
    } else
      throw new Meteor.Error('null-message'); // passed in empty message
  },

  addUserMessage: function (usr, msg) { // add message, with userId() (issues)
    var poster = Meteor.users.findOne(usr);
    if (msg.value !== '') {
      if (poster) {
        Messages.insert({
          owner: poster._id,
          repo: poster.profile.repo,
          name: poster.profile.login,
          message: msg,
          time: Date.now()
        });
      } else
        throw new Meteor.Error('null-poster'); // user account is not in mongo
    } else
      throw new Meteor.Error('null-message'); // they passed in empty message
  },



  //////////////////
  // TASK MANAGEMENT
  //////////////////

  addTask: function (text) { // add a task to repo, with this userid
    Tasks.insert({
      text: text,
      time: new Date(),
      owner: Meteor.userId(),
      repo: Meteor.user().profile.repo,
      username: Meteor.user().profile.login
    });
    Meteor.call('addMessage', 'created task - ' + text); // post to the feed
  },

  setChecked: function (task) { // on task check/uncheck, notify
    Tasks.update(task._id, { $set: { checked: ! task.checked } });
    var act = (task.checked ? 'revived' : 'completed');
    Meteor.call('addMessage', act + ' task  - ' + task.text);
  },

  deleteTask: function (task) { // delete a task from the current repo
    Tasks.remove(task._id); // actually remove it
    Meteor.call('addMessage', 'deleted task - ' + task.text);
  },



  //////////////////
  // ROLE MANAGEMENT
  //////////////////

  setPilot: function() { // change the current users profile.role to pilot
    return Meteor.users.update(
      {'_id': Meteor.userId()},
      {$set : {'profile.role':'pilot'}}
    );
  },

  setCopilot: function() { // change the current users profile.role to pilot
    return Meteor.users.update(
      {'_id': Meteor.userId()},
      {$set : {'profile.role':'copilot'}}
    );
  },



  //////////////////
  // REPO MANAGEMENT
  //////////////////

  loadRepo: function(gr) { // load a repo into code pilot
    Meteor.call('setRepo', gr); // set the active project / repo
    Meteor.call('initBranches', gr); // get all the possible branches
    Meteor.call('initCommits'); // pull commit history for gr repo
    var branch = gr.repo.default_branch;
    Meteor.call('loadHead', branch); // load the head of gr branch into CP
    Meteor.call('postLabel'); // register codepilot label for new repo
    Meteor.call('loadHead', branch); // TRY AGAIN!!! Y U NO WORK :(
    Meteor.call('setBranch', gr.repo.default_branch);
    var newFull = gr.repo.owner.login + '/' + gr.repo.name;
    Meteor.call('addMessage', 'started working on repo - ' + newFull);
  },

  setRepo: function(gr) { // set git repo & default branch
    return Meteor.users.update(
      {'_id': Meteor.userId()},
      {$set : {
        'profile.repo': gr._id,
        'profile.repoName': gr.repo.name,
        'profile.repoOwner': gr.repo.owner.login,
        'profile.repoBranch': gr.repo.owner.default_branch
      }});
  },

  loadBranch: function(bn) { // load a repo into code pilot
    Meteor.call('setBranch', bn); // set branch for current user
    Meteor.call('initCommits'); // pull commit history for this repo
    Meteor.call('loadHead', bn); // load the head of this branch into CP
  },

  setBranch: function(bn) { // set branch name
    return Meteor.users.update(
      {'_id': Meteor.userId()},
      {$set : {
        'profile.repoBranch': bn,
      }});
  },

});
