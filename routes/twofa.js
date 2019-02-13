const JSE = global.JSE;
const authenticator = require('authenticator');
const express = require('express');

const router = express.Router();

/**
 * @name /twofa/setup2fa/*
 * @description Setup two factor authentication on a user account
 * @memberof module:jseRouter
 */
router.post('/setup2fa/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 554. No Session Variable Supplied For 2fa Setup"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials.twoFactorAuth === true) {
			res.status(400).send('{"fail":1,"notification":"Two factor authentication is already setup on this account"}');
			return false;
		}
		const authuri = authenticator.generateTotpUri(goodCredentials.authKey, goodCredentials.email, "JSEcoin", 'SHA1', 6, 30);
		res.send('{"authuri":"'+authuri+'"}');
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error twofa.js 20. No Session Variable Supplied For 2fa Setup"}'); return false;
	});
	return false;
});

/**
 * @name /twofa/test2fa/*
 * @description Test two factor authentication to ensure it's setup correctly
 * @memberof module:jseRouter
 */
router.post('/test2fa/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 576. No Session Variable Supplied For 2fa Test"}'); return false; }
	const session = req.body.session;
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials.twoFactorAuth === true) {
			res.status(400).send('{"fail":1,"notification":"Two factor authentication is already setup on this account"}');
			return false;
		}
		if (req.body.authCode && authenticator.verifyToken(goodCredentials.authKey, JSE.jseFunctions.cleanString(req.body.authCode))) {
			console.log('New 2fa setup for '+goodCredentials.email);
			JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/twoFactorAuth',true);
			res.send('{"success":1,"notification":"You have successfully setup two factor authentication"}');
			JSE.jseFunctions.sendStandardEmail(goodCredentials.email,'2FA Setup On JSEcoin','Thank you for improving your account security.<br><br>Two factor authentication is now set up on your account.<br><br>Thank you for using JSEcoin to secure your digital funds.');
		} else {
			res.status(400).send('{"fail":1,"notification":"Token expried: Please try entering a new code"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error twofa.js 42. Session Variable Error For 2fa Test"}'); return false;
	});
	return false;
});

/**
 * @name /twofa/remove2fa/*
 * @description Remove two factor authentication from users account
 * @memberof module:jseRouter
 */
router.post('/remove2fa/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 605. No Session Variable Supplied For 2fa Removal"}'); return false; }
	const session = req.body.session;
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (req.body.authCode && authenticator.verifyToken(goodCredentials.authKey, JSE.jseFunctions.cleanString(req.body.authCode))) {
			console.log('2fa removed for '+goodCredentials.email);
			JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/twoFactorAuth',false);
			res.send('{"success":1,"notification":"You have successfully removed two factor authentication"}');
			JSE.jseFunctions.sendStandardEmail(goodCredentials.email,'2FA Removed On JSEcoin','You have removed two factor authentication on your account. If you did not make this change, please contact admin@jsecoin.com as soon as possible.');
		} else {
			res.status(400).send('{"fail":1,"notification":"Token expried: Please try entering a new code"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error twofa.js 60. Session Variable Error For 2fa Removal"}'); return false;
	});
	return false;
});

module.exports = router;
