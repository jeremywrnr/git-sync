CodePilot
=========

[![MIT License](https://img.shields.io/npm/l/alt.svg?style=flat)](http://jeremywrnr.com/mit-license)


This is a tool meant to help people collaborate on code more seamlessly by
integrating some core programming tasks into a single web IDE. It also
encourages collaborator awareness without generating onerous distractions, and
can serve as a bridge for people learning to use version control.


## features

- project-wide synchronous editing (updates in real time)
- testing, both with PythonTutor and our website renderer
- robust GitHub interface (push, pull, checkout, fork, branch)


## development

First:

    git clone https://github.com/jeremywrnr/codepilot.git

You will need to register an application key with github in order to login with
their OAuth system - more information on how you can do that [here][oauth]. On
a related note, there is the [github developer program][devel], which I think
you (may?) need to join if you want to register an app - this is free. The
application will look for deployment keys in the `app/private` folder, in
production.json and development.json, respectively. This is what the insides of
those files should resemble:

    {
        "service": "github",
        "clientId": "YOUR-CLIENT-ID",
        "secret": "YOUR-SECRET-ID"
    }

Once this is setup, simply start running it locally:

    meteor

Toasts: https://atmospherejs.com/chrismbeckett/toastr


## deployment

This application is currently deployed on Heroku, with the following buildpack
set up to decrypt the secret key information in `private/`. The `ROOT_URL`
variable has to be set to where you are hosting it, beforehand. Then,
`horse-buildpack` is used to install meteor and start up the server.

- https://github.com/jeremywrnr/heroku-buildpack-run
- https://github.com/AdmitHub/meteor-buildpack-horse


## background

This project started out as work done for my master's thesis, which can be found
[here](https://jeremywrnr.com/ms-thesis/).


[devel]:https://developer.github.com/program/
[oauth]:https://developer.github.com/v3/oauth/

