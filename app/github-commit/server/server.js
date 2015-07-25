// github config

var inDevelopment = function(){return process.env.NODE_ENV === "development"; };

Meteor.startup(function () { // get correct github auth key

  ServiceConfiguration.configurations.remove({service: "github"});
  var prodAuth = JSON.parse(Assets.getText('production.json'));
  var devAuth = JSON.parse(Assets.getText('development.json'));
  var GHAuth = ( inDevelopment() ? devAuth : prodAuth );
  ServiceConfiguration.configurations.insert( GHAuth );

  // node-github setup
  github = new GitHub({
    version: "3.0.0",
    timeout: 5000,
    debug: true,
    protocol: "https",
    headers: { "User-Agent": "Code Pilot" }
  }); // oauth for api 5000/day)
  github.authenticate({
    type: "oauth",
    key: GHAuth.clientId,
    secret: GHAuth.secret
  });

  // populating the commit log
  if (Commits.find().count() === 0){
    function commitInsert(c){Commits.insert(c)}
    var commits = Meteor.call('getAllCommits');
    commits.map(commitInsert);
  }

  // hard coding the file structure
  Files.upsert({'title':'site.html'},{'title':'site.html'});
  Files.upsert({'title':'site.css'},{'title':'site.css'});
  Files.upsert({'title':'site.js'},{'title':'site.js'});

});

// setting up a new account with github api

Accounts.onCreateUser(function(options, user){

  var accessToken = user.services.github.accessToken, result, profile;
  result = Meteor.http.get("https://api.github.com/user", {
    headers: { "User-Agent": "Code Pilot" },
    params: { access_token: accessToken }
  });
  if (result.error) throw result.error;
  profile = _.pick( result.data, "login", "name", "avatar_url",
                   "url", "blog", "email", "html_url");
  user.profile = profile;
  user.profile.role = "copilot"
  return user;

});