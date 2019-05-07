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
	const mlDataString = JSE.jseFunctions.cleanString(req.body.mlData);
	if (mlDataString.length > 5000) {
		res.status(400).send('{"fail":1,"notification":"String length error captcha.js e26"}');
		return false;
	}
	let tmpObject = false;
	try {
		tmpObject = JSON.parse(mlDataString);
	}	catch (e) {
		res.status(400).send('{"fail":1,"notification":"Could not parse JSON data captcha.js e33"}');
		return false;
	}
	if (tmpObject) {
		JSE.jseDataIO.pushVariable('adxCaptcha/tmpData', mlDataString, function(pushRef) {
			res.send('{"success":1,"pushRef":"'+pushRef+'"}');
		});
	}
	return false;
});

module.exports = router;
