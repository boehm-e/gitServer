var pushover = require('pushover');
var repos = pushover("/opt/git");
var fs = require('fs');
let nameSize = 15;
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var auth = require('./auth');


var express = require('express')
var app = express()
app.use(bodyParser.urlencoded({
  extended: true
}));

repos.on('push', function (push) {
  console.log('push ' + push.repo + '/' + push.commit + ' (' + push.branch + ')'
);
push.accept();
});

repos.on('fetch', function (fetch) {
  console.log('fetch ' + fetch.commit);
  fetch.accept();
});



var generateRandomRepo = (req, res, next) => {
  repos.list((err, names) => {
    console.log("HERE");
    while (true) {
      if (!(names.indexOf(name) > -1)) {
        var name = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < nameSize; i++ ){
          name += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return repos.create(name, () => {
          next(name);
        });
      }
    }
  });
}


var generateRandomMiddleware = (req, res, next) => {
  var first = req.originalUrl.split('/')[1];
  if (first == "generateRandom") {
    console.log(req.body);
    generateRandomRepo(req, res, (name) => {
      console.log("NAME : ",name);
      var response = {};
      var token = jwt.sign({link: name}, secret, {expiresIn: 60 * 24});
      response.clone = `git clone http://localhost:7000/${name} test-seedup`;
      response.name = `${req.params.firstName} ${req.params.lastName}`;
      response.token = token;
      res.send(JSON.stringify(response));
    });
  } else {
    next();
  }
}



app.get('/:projectPath*', function(req, res) {
  console.log('cloning ')
  console.log(req.body, req.params);
  repos.handle(req, res);
});

app.post('/:projectPath*', generateRandomMiddleware, function(req, res) {
  console.log('handling post...')
  repos.handle(req, res);
});

function isAuthenticated(req, res, next){
    var errorMsg = {"message":"not authenticated"}
    var token = req.headers['authorization'];
    token = (token == undefined) ? req.body.token : token;
    console.log("TOKEN : "+token);
    jwt.verify(token, secret, function(err, decoded){
        if(!err){
            req.user = decoded.username;
            next();
        } else {
            res.status(403);
            res.send(errorMsg);
        }
    });
}

var secret = auth.tokenSecret;
app.listen(7000)
