Package.describe({
  version: "1.0.0",
  name: "jeremywrnr:codepilot",
  summary: "Pair programming toolset.",
  git: "https://github.com/jeremywrnr/codepilot",
});


Package.onUse(function(api) {
  api.export("Codepilot");
  api.export("Difflib");

  api.versionsFrom("METEOR@1.2");
  api.addFiles(["difflib.js", "codepilot.js"]);
});


Package.onTest(function (api) {
  api.use(["tinytest", "jeremywrnr:codepilot"]);
  api.addFiles("codepilot-tests.js");
});

