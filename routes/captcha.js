const JSE = global.JSE;
const express = require('express');

const router = express.Router();

/**
 * @name /captcha/testdata/*
 * @description Store test data to process and run through machine learning training system
 * @memberof module:jseRouter
 */
router.post('/testdata/*', function (req, res) {
	let naughtyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (naughtyIP.indexOf(',') > -1) { naughtyIP = naughtyIP.split(',')[0]; }
	if (naughtyIP.indexOf(':') > -1) { naughtyIP = naughtyIP.split(':').slice(-1)[0]; }
	if (!JSE.apiLimits[naughtyIP]) {
		JSE.apiLimits[naughtyIP] = 1;
	} else {
		JSE.apiLimits[naughtyIP] += 1;
	}
	if (JSE.apiLimits[naughtyIP] > 5) {
		res.status(400).send('{"fail":1,"notification":"Too many requests captcha.js e21"}');
		return false;
	}
	let mlDataString = '';
	try {
		mlDataString = JSON.stringify(req.body.mlData);
	} catch (e) {
		res.status(400).send('{"fail":1,"notification":"JSON formatting error captcha.js e27"}');
		return false;
	}
	if (mlDataString.length > 5000  || mlDataString.length < 500) {
		res.status(400).send('{"fail":1,"notification":"String length error captcha.js e31"}');
		return false;
	}
	JSE.jseDataIO.pushVariable('adxCaptcha/tmpData', mlDataString, function(pushRef) {
		res.send('{"success":1,"pushRef":"'+pushRef+'"}');
	});
	return false;
});

module.exports = router;
