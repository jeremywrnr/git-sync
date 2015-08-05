// server & github api methods

Meteor.methods({

  //////////////////
  // FILE MANAGEMENT
  //////////////////

  newFile: function() { // create a new file, unnamed, return id
    return Meteor.call('createFile', 'untitled');
  },

  createFile: function(ft) { // make new file with filetitle (ft), return id
    Meteor.call('addMessage', ' created file: ' + ft);
    return Async.runSync(function(done){
      Files.insert(
        {title: ft, repo: Meteor.user().profile.repo},
        function(e,id){done(e,id)});
    }).result;
  },

  deleteFile: function(id) { // with id, delete a file from system
    ShareJS.model['delete'](id);
    Files.remove(id);
    Docs.remove(id);
  },

  resetFiles: function() { // reset db and hard code the file structure
    Files.find({}).map(function delFile(f){ Meteor.call('deleteFile', f._id)});
    var base = [{'title':'site.html'},{'title':'site.css'},{'title':'site.js'}];
    base.map(function(f){ // for each of the hard coded files
      var id = Meteor.call('createFile', f.title);
    });
  },



  /////////////////////
  // SHAREJS MANAGEMENT
  /////////////////////

  getShareJSDoc: function(file) { // give live editor copy, v and snapshot
    return Docs.find({ _id: file._id }).fetch()[0].data
  },

  postShareJSDoc: function(file) { // update files with their ids
    var sjs = Meteor.call('getShareJSDoc', file) // get doc and version
    ShareJS.model.applyOp( file._id, {
      op: [
        { p:0, d: sjs.snapshot }, // delete old content
        { p:0, i: file.content } // insert new blob content
      ],
      meta:null,
      v:sjs.v // apply it to last seen version
    });
  },

  testShareJS: function() { // update contents from sjs
    Files.find({}).map(function readSJS(f){
      Files.update(
        {'_id': f._id},
        {$set:
          { content: Meteor.call('getShareJSDoc',f).snapshot }
        });
    });
  },



  //////////////////////
  // GITHUB GET REQUESTS
  //////////////////////

  ghAuth: function(){ // authenticate for secure api calls
    github.authenticate({
      type: 'token',
      token: Meteor.user().services.github.accessToken
    });
  },

  getAllRepos: function() { // put them in db, serve to user (not return)
    Meteor.call('ghAuth');
    var repos = github.repos.getAll({ user: Meteor.user().profile.login });
    repos.map(function attachUser(gr){ // attach user to git repo (gr)
      if (Repos.find({ id: gr.id }).count() > 0) // repo already exists
      Repos.update({ id: gr.id }, {$push: {users: Meteor.userId() }});
      else
        Repos.insert({ id: gr.id, users: [ Meteor.userId() ], repo: gr });
      Meteor.call('getBranches', gr);
    });
  },

  getAllCommits: function() { // give all commits
    return github.repos.getCommits({
      user: Meteor.user().profile.repoOwner,
      repo: Meteor.user().profile.repoName
    });
  },

  getCommit: function(commitSHA) { // give commit res
    return github.repos.getCommit({
      user: Meteor.user().profile.repoOwner,
      repo: Meteor.user().profile.repoName,
      sha: commitSHA
    });
  },

  getBranches: function(gitRepo) { // give all branches for repo
    var brs = github.repos.getBranches({
      user: gitRepo.owner.login,
      repo: gitRepo.name
    });
    Repos.update({ id: getRepo.id }, { $set: {branches: brs} });
  },

  getBranch: function(branchName) { // give branch res
    return github.repos.getBranch({
      user: Meteor.user().profile.repoOwner,
      repo: Meteor.user().profile.repoName,
      branch: branchName
    });
  },

  getTree: function(treeSHA) { // gives tree res
    return github.gitdata.getTree({
      user: Meteor.user().profile.repoOwner,
      repo: Meteor.user().profile.repoName,
      sha: treeSHA
    });
  },

  getBlobs: function(tr) { // update files with tree results (tr)
    tr.tree.forEach(function updateBlob(b){
      var oldcontent = github.gitdata.getBlob({
        headers:{'Accept':'application/vnd.github.VERSION.raw'},
        user: Meteor.user().profile.repoOwner,
        repo: Meteor.user().profile.repoName,
        sha: b.sha
      });
      // $set component instead of creating a new object
      Files.upsert(
        { repo: Meteor.user().profile.repo, title: b.path},
        { $set: {content: oldcontent}}
      );
    });
  },



  ///////////////////////
  // GITHUB POST REQUESTS
  ///////////////////////

  postTree: function(t){ // gives tree SHA hash id
    Meteor.call('ghAuth');
    return github.gitdata.createTree({
      user: Meteor.user().profile.repoOwner,
      repo: Meteor.user().profile.repoName,
      tree: t.tree,
      base_tree: t.base
    }).sha;
  },

  postCommit: function(c) { // gives all commit info, with commit c
    Meteor.call('ghAuth');
    return github.gitdata.createCommit({
      user: Meteor.user().profile.repoOwner,
      repo: Meteor.user().profile.repoName,
      message: c.message,
      author: c.author,
      parents: c.parents,
      tree: c.tree
    });
  },

  postRef: function(cr){ // update ref to new commit, with commit results (cr)
    Meteor.call('ghAuth');
    return  github.gitdata.updateReference({
      user: Meteor.user().profile.repoOwner,
      repo: Meteor.user().profile.repoName,
      ref: 'heads/' + Meteor.user().profile.repoBranch,
      sha: cr.sha
    });
  },



  ////////////////////////////////////////////////////////
  // top level function, grab files and commit to github
  ////////////////////////////////////////////////////////

  makeCommit: function(msg) { // grab sjs contents, commit to github

    // getting file ids, names, and content
    var files = Files.find({repo: Meteor.user().profile.repo}).map(
      function getFile(f){
        var shareJSDoc = Meteor.call('getShareJSDoc', f);
        if (debug) console.log(shareJSDoc);
        return {
          path: f.title,
          content: shareJSDoc.snapshot
        }
      }
    );

    // a diff would be done here, remove unchanged files from list
    // or add new files, that were not in the previous commit

    // construct commit tree content
    var blobs = files.map(function(f){
      return {
        path: f.path,
        mode: '100644',
        type: 'blob',
        content: f.content
      }
    });

    if (debug) console.log(blobs);

    // get old tree and update it with new shas, post and get that sha
    var bname = Meteor.user().profile.repoBranch;
    var branch = Meteor.call('getBranch', bname);
    var oldTree = Meteor.call('getTree', branch.commit.commit.tree.sha);
    var newTree = { 'base': oldTree.sha, 'tree': blobs };
    var treeSHA = Meteor.call('postTree', newTree);

    // specify author of this commit
    var commitAuthor = {
      name: Meteor.user().profile.name,
      email: Meteor.user().profile.email,
      date: new Date()
    };

    // make the new commit result object
    var commitResult = Meteor.call('postCommit', {
      message: msg, // passed in
      author: commitAuthor,
      parents: [ branch.commit.sha ],
      tree: treeSHA
    });

    // update the ref, point to new commmit
    Meteor.call('postRef', commitResult);

    // get the latest commit from the branch head
    var lastCommit = Meteor.call('getBranch', bname).commit;

    // post into commit db with repo tag
    Meteor.call('addCommit', lastCommit);

    // update the feed with new commit
    Meteor.call('addMessage', 'commited ' + msg);

  },



  /////////////////////////////////////////////////
  // top level function, pull files and load editor
  /////////////////////////////////////////////////

  loadHead: function(bname) { // load head of branch, from sha
    var sha =  Meteor.call('getBranch', bname).commit.sha;
    Meteor.call('loadCommit', sha);
  },

  loadCommit: function(sha) { // takes commit sha, loads into sjs
    var commitResults = Meteor.call('getCommit', sha);
    var treeResults = Meteor.call('getTree', commitResults.commit.tree.sha);
    var br = Meteor.call('getBlobs', treeResults);

    // move files old contents into sharejsdoc
    var repoFiles = Files.find({ repo: Meteor.user().profile.repo });
    repoFiles.map(function loadSJS(f){ Meteor.call('postShareJSDoc', f) });
  },

  addCommit: function(c){ // adds a commit, links to repo
    Commits.upsert({
      repo: Meteor.user().profile.repo,
      sha: c.sha
    },{
      repo: Meteor.user().profile.repo,
      sha: c.sha,
      commit: c
    });
  },

  initCommits: function(){ // re-populating the commit log
    var gc = Meteor.call('getAllCommits');
    gc.map(function(c){Meteor.call('addCommit', c)});
  }

});
