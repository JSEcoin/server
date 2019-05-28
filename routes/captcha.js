const JSE = global.JSE;
const express = require('express');
const jseMachineLearning = require("./../modules/machinelearning.js");

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

/**
 * @name /captcha/load/*
 * @description load static captcha files
 * @memberof module:jseRouter
 */
router.use('/load/', express.static('./../embed/captcha/'));

/**
 * @name /captcha/request/*
 * @description Send mlData and get a rating and pass in return. Used for both initial tick and on game completion
 * @memberof module:jseRouter
 */
router.post('/request/*', async (req, res) => {
	let clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (clientIP.indexOf(',') > -1) { clientIP = clientIP.split(',')[0]; }
	if (clientIP.indexOf(':') > -1) { clientIP = clientIP.split(':').slice(-1)[0]; }
	if (!JSE.apiLimits[clientIP]) {
		JSE.apiLimits[clientIP] = 1;
	} else {
		JSE.apiLimits[clientIP] += 1;
	}
	if (JSE.apiLimits[clientIP] > 50) {
		res.status(400).send('{"fail":1,"notification":"Too many requests captcha.js e56"}');
		return false;
	}
	const mlData = req.body.mlData;
	let mlDataString = '';
	try {
		mlDataString = JSON.stringify(mlData);
	} catch (e) {
		res.status(400).send('{"fail":1,"notification":"JSON formatting error captcha.js e63"}');
		return false;
	}
	if (mlDataString.length > 5000  || mlDataString.length < 500) {
		res.status(400).send('{"fail":1,"notification":"String length error captcha.js e67"}');
		return false;
	}
	let mlRating = jseMachineLearning.testCaptcha(clientIP,mlData);
	const captchaLog = await JSE.jseDataIO.asyncGetVar('adxCaptchaLog/'+clientIP+'/');
	let captchaCount = 0;
	let totalRating = 0;
	let previousRating = 0;
	if (captchaLog) {
		Object.keys(captchaLog).forEach((cLog) => {
			captchaCount += 1;
			totalRating += cLog.totalRating;
		});
		previousRating = totalRating / captchaCount;
	} else {
		previousRating = await JSE.jseDataIO.asyncGetVar('adxCaptchaIP/'+clientIP+'/');
	}
	if (previousRating && previousRating > 0) {
		mlRating = Math.round((mlRating + previousRating) / 2);
	}
	let passBoolean = false;
	if (mlRating > 50) passBoolean = true;
	if (mlData.gamesCompleted > 0) {
		res.send('{"success":1,"rating":'+mlRating+',"pass":"'+passBoolean+'","ip":"'+clientIP+'"}');
	} else {
		if (captchaCount > 3) passBoolean = false;
		res.send('{"success":1,"rating":'+mlRating+',"pass":"'+passBoolean+'","ip":"'+clientIP+'"}');
	}
	JSE.jseDataIO.setVariable('adxCaptchaIP/'+clientIP+'/', mlRating);
	const logEntry = {
		ts: new Date().getTime(),
		rating: mlRating,
		autoPass: passBoolean,
	};
	JSE.jseDataIO.pushVariable('adxCaptchaLog/'+clientIP+'/', logEntry, function(pushRef) {});
	return false;
});

module.exports = router;
