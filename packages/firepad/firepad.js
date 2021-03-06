// interface for interacting with Firepad through meteor
// most methods have to be called from client since jsdom cant run on the
// server, which means that firepad cant run on the meteor backend.

FirepadAPI = {}

// getting whether the host is in production or development

var setup = function (dev) {
  var prodFB = "https://project-3627267568762325747.firebaseio.com/"
  var devFB = "https://gitsync-test.firebaseio.com/"
  this.host = (dev ? devFB : prodFB);
}

// return the current branch/repo files

var userfiles = function () {
  var user = Meteor.user(),
    prof = undefined;
  if (user)
    prof = user.profile;
  if (prof) return Files.find({
    repo: user.repo,
    branch: user.repoBranch
  });
}


  /***
   * |GET|
   *
   * FIREPAD -> file.CONTENT methods
   * - update files meteor content based on the firepad buffer
   * - also used when updating the tester vision
   * - this methods are called on the client to have access to firepad from the
   *   header scripts, and then use a meteor method callback to gain access to
   *   updating the files once the content has been retrieved from the firepad
   *   backend. i am actually largely impressed with how robust and fast
   *   firepad seems to work since transitioning over from the internal sharejs
   *   editor. maybe it is the snapshot feature, which limits how many
   *   transformations have to be performed to the get the current state of the
   *   document.
   ***/

var getText = function (id, cb) { // return the contents of firepad
  var headless = Firepad.Headless(Session.get("fb") + id);
  headless.getText(function(txt) {
    headless.dispose();
    cb(txt);
  });
}

var getAllText = function(files, cb) { // apply callmback to all files
  files.map(function(id) {
    FirepadAPI.getText(id, function(txt) {
      cb(id, txt);
    });
  });
}


  /***
   * |SET|
   *
   * file.CACHE -> FIREPAD methods
   * - update firepad buffer from last committed version of file
   * - gets content based on the cached version from last commit
   * - dispose removes the connection to the firepad instance.
   ***/

var setText = function (id, cb) { // update firebase with their ids
  var headless = Firepad.Headless(Session.get("fb") + id);
  headless.setText(
    Files.findOne(id).cache,
    function() {
      headless.dispose()
      cb(); // callback once done
    }
  );
}

var setAllText = function (cb) { // update all project caches from firepad (for reset)
  FirepadAPI.userfiles().fetch().map(function(file) {
    // TODO if the last one - then pass in the callback
    FirepadAPI.setText(file._id)
  });

  cb(); // callback once done
}


// exporting to package
FirepadAPI.setup = setup;
FirepadAPI.getText = getText;
FirepadAPI.setText = setText;
FirepadAPI.userfiles = userfiles;
FirepadAPI.getAllText = getAllText;
FirepadAPI.setAllText = setAllText;

