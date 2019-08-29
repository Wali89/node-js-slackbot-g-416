"use strict";

const rp = require('request-promise');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

const TOKEN = '8Ya2e951zfMJM8jdIxAUjBu6K';

const validRequest = (token) => {
  return TOKEN == token;
};

const fetchGithubUser = (username) => {
  const url =  'https://api.github.com/users/' + username;
  return rp({
    uri: url,
    headers: {
        'User-Agent': 'Flatiron-Slackbot-Lab'
    },
  });
};

const prepareResponse = (info, paramToGet) => {
  let rv = { response_type: "ephemeral", mrkdwn: true };
  const EOL = '\n';
  rv.text = '*Github User: @' + info.login + ' (' + info.name + ')*:' + EOL;
  if (!paramToGet) {
    rv.text += '> Company: ' + info.company + EOL;
    rv.text += '> Location: ' + info.location + EOL;
    rv.text += '> Hireable: ' + info.hireable + EOL;
    rv.text += '> Githup Profile: ' + info.html_url + EOL;
  }
  else {
    rv.text += '> ' + paramToGet.charAt(0).toUpperCase() + paramToGet.slice(1) + ': ';
    rv.text += info[paramToGet];
  }
  return rv;
};

app.get('/', (req,res) => {
  res.send('ok');
});

app.post('/', (req, res) => {
  if (!validRequest(req.body.token)) {
    res.status(400).send();
    return;
  }
  if (!req.body.text) {
    res.status(400).send({
      response_type: 'ephemeral',
      text: "Please specify a user to find."
    });
    return;
  }
  const cmd = req.body.text.split(' '),
        user = cmd[0],
        paramToGet = cmd[1];
  fetchGithubUser(user).then((resp) => {
    const result = JSON.parse(resp);
    res.send(prepareResponse(result, paramToGet));
  }).catch((err) => {
    let errMsg = { response_type: "ephemeral" };
    if('statusCode' in err && err.statusCode == 404) {
      errMsg.text = "Sorry. Unable to find that user.";
      res.status(err.statusCode).send(errMsg);
    }
    else {
      const status = err.statusCode ? err.statusCode : 500;
      errMsg.text = "Oop! Something went wrong. Please try again.";
      res.status(status).send(errMsg);
    }
  });
});

// This code "exports" a function 'listen` that can be used to start
// our server on the specified port.
exports.listen = function(port, callback) {
  callback = (typeof callback != 'undefined') ? callback : () => {
    console.log('Listening on ' + port + '...');
  };
  app.listen(port, callback);
};