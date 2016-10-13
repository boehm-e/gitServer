var pushover = require('pushover');
var repos = pushover(f'/opt/git/');
var fs = require('fs');

repos.on('push', function (push) {
  console.log('push ' + push.repo + '/' + push.commit + ' (' + push.branch + ')'
);
push.accept();
});

repos.on('fetch', function (fetch) {
  console.log('fetch ' + fetch.commit);
  fetch.accept();
});

var generateRandomName = (next) => {
  repos.list((err, names) => {
    while (true) {
      var name = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for( var i=0; i < 5; i++ ){
        name += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      console.log("NAME : ",name)
      if (!(names.indexOf(name) > -1)) {
        return next(name);
      }
    }
  });
}

var generateRandomRepo = (req, res) => {
  generateRandomName((name) => {
    console.log("REPO NAME : ", name);
    repos.create(name, () => {
      res.send("ok")
    });
  })
}

var express = require('express')
var app = express()

app.get('/:projectPath', function(req, res) {
  console.log('cloning ')
  repos.handle(req, res);
});
app.post('/:projectPath', function(req, res) {
  console.log('handling post...')
  repos.handle(req, res);
});
app.post('/random/generate', function(req, res) {
  generateRandomRepo(req, res);
})

app.listen(7000)
