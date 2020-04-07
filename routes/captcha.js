const JSE = global.JSE;
const express = require('express');
const jseMachineLearning = require("./../modules/machinelearning.js");

const router = express.Router();

/**
 * @name /captcha/load/*
 * @description load static captcha files
 * @memberof module:jseRouter
 */
router.use('/load/', express.static('./embed/captcha/'));

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
	/*
	let mlDataString = '';
	try {
		mlDataString = JSON.stringify(mlData);
	} catch (e) {
		res.status(400).send('{"fail":1,"notification":"JSON formatting error captcha.js e63"}');
		return false;
	}
	if (mlDataString.length > 15000  || mlDataString.length < 500) {
		res.status(400).send('{"fail":1,"notification":"String length error captcha.js e67"}');
		return false;
	}
	*/
	let mlRating = await jseMachineLearning.testCaptcha(clientIP,mlData);
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
		res.send('{"success":1,"rating":'+mlRating+',"pass":'+passBoolean+',"ip":"'+clientIP+'"}');
	} else {
		if (captchaCount > 3) passBoolean = false;
		res.send('{"success":1,"rating":'+mlRating+',"pass":'+passBoolean+',"ip":"'+clientIP+'"}');
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

/**
 * @name /captcha/check/:ip/
 * @description Check designed for server side usage of captcha data.
 * @memberof module:jseRouter
 */
router.get('/check/:ip/', (req, res) => {
	let clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (clientIP.indexOf(',') > -1) { clientIP = clientIP.split(',')[0]; }
	if (clientIP.indexOf(':') > -1) { clientIP = clientIP.split(':').slice(-1)[0]; }
	if (!JSE.apiLimits[clientIP]) {
		JSE.apiLimits[clientIP] = 1;
	} else {
		JSE.apiLimits[clientIP] += 1;
	}
	if (JSE.apiLimits[clientIP] > 360) { // 1 per 5 seconds
		res.status(400).send('{"fail":1,"notification":"Too many requests captcha.js e94"}');
		return false;
	}
	const targetIP = JSE.jseFunctions.cleanString(req.params.ip);
	JSE.jseDataIO.getVariable('adxCaptchaIP/'+targetIP+'/', function(mlRating) {
		if (!mlRating) {
			res.send('{"success":1,"rating":0,"pass":false,"knownIP":false, "ip":"'+targetIP+'"}');
		} else {
			let passBoolean = false;
			if (mlRating && mlRating >= 50) passBoolean = true;
			res.send('{"success":1,"rating":'+mlRating+',"pass":'+passBoolean+',"knownIP":true,"ip":"'+targetIP+'"}');
		}
	});
	return false;
});

module.exports = router;
