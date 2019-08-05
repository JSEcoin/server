/**
 * @module jseRouter
 * @description Routes and end points based on express framework
 * @requires express
 */

const JSE = global.JSE;
const express = require('express');

const jseRouter = express.Router();

const index = require('./index');
const load = require('./load');
const admin = require('./admin');
const register = require('./register');
const confirm = require('./confirm');
const login = require('./login');
const twofa = require('./twofa');
const password = require('./password');
const newsite = require('./newsite');
const checkout = require('./checkout');
const push = require('./push');
const api = require('./api');
const ethereum = require('./ethereum');
const advertising = require('./advertising');
const captcha = require('./captcha');
const enterprise = require('./enterprise');
const account = require('./account');


jseRouter.use(function(req, res, next) {
  if (req.method === 'OPTIONS') {
		const headers = {};
		headers["Access-Control-Allow-Origin"] = "*";
		headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS";
		headers["Access-Control-Allow-Credentials"] = false;
		//headers["Access-Control-Max-Age"] = '86400'; // 24 hours
		headers["Access-Control-Allow-Headers"] = "cache-control, Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization";
		res.writeHead(200, headers);
		res.end();
  } else {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "cache-control, Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  }
});

// include /server/ for old URLs when we were reverse proxying the server.
jseRouter.use('(|/server)/', index);
jseRouter.use('(|/server)/load', load);
jseRouter.use('(|/server)/admin', admin);
jseRouter.use('(|/server)/register', register);
jseRouter.use('(|/server)/confirm', confirm);
jseRouter.use('(|/server)/login', login);
jseRouter.use('(|/server)/twofa', twofa);
jseRouter.use('(|/server)/password', password);
jseRouter.use('(|/server)/newsite', newsite);
jseRouter.use('(|/server)/checkout', checkout);
jseRouter.use('(|/server)/push', push);
jseRouter.use('(|/server)/v1.7', api);
jseRouter.use('(|/server)/api', api);
jseRouter.use('(|/server)/ethereum', ethereum);
jseRouter.use('(|/server)/advertising', advertising);
jseRouter.use('(|/server)/captcha', captcha);
jseRouter.use('(|/server)/enterprise', enterprise);
jseRouter.use('(|/server)/account', account);

module.exports = jseRouter;
