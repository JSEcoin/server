const JSE = global.JSE;
const fs = require('fs');
const request = require('request');
const maxmind = require('maxmind');
const authenticator = require('authenticator');
const jseAPI = require("./../modules/apifunctions.js");
const express = require('express');

const geoDB = maxmind.openSync('./geoip/GeoIP2-Country.mmdb'); // actually in ../geoip but this is run from ../server.js
const router = express.Router();

/**
 * @name /register/*
 * @description Register a new account, includes queries to recaptcha API and anonymous IP checks
 * @memberof module:jseRouter
 */
router.post('/*', function (req, res) {
	const newUser = {};
	newUser.email = JSE.jseFunctions.cleanString(String(req.body.email)).toLowerCase();
	// Recaptcha
	if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    const failed = {};
		failed.fail = 1;
		failed.notification = 'Registration Failed: Recaptcha Error 452, Please Try Again';
		res.status(400).send(JSON.stringify(failed));
		return;
  }
  const secretKey = JSE.credentials.recaptchaSecretKey;
	const verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'];
  request(verificationUrl,function(error,response,bodyRaw) {
    const body = JSON.parse(bodyRaw);
    if (body.success && body.success === true) {
			newUser.password = JSE.jseFunctions.cleanString(String(req.body.password)); //need bad chars removing?
			newUser.passwordHashed = JSE.jseFunctions.sha256(newUser.password);
			delete newUser.password; // remove password from database;
			newUser.session = JSE.jseFunctions.randString(32);
			if (req.body.name) { newUser.name = JSE.jseFunctions.cleanString(req.body.name); } else { newUser.name = 'unknown'; }
			if (req.body.address) { newUser.address = JSE.jseFunctions.cleanString(req.body.address); } else { newUser.address = 'unknown'; }
			if (req.body.country) { newUser.country = JSE.jseFunctions.cleanString(req.body.country); } else { newUser.country = 'XY'; }
			if (req.body.source) { newUser.source = JSE.jseFunctions.cleanString(req.body.source); } else { newUser.source = 'unknown'; }
			if (req.body.campaign) { newUser.campaign = JSE.jseFunctions.cleanString(req.body.campaign); } else { newUser.campaign = 'unknown'; }
			if (req.body.content) { newUser.content = JSE.jseFunctions.cleanString(req.body.content); } else { newUser.content = 'unknown'; }
			if (req.body.jseUnique) { newUser.jseUnique = JSE.jseFunctions.cleanString(req.body.jseUnique); } else { newUser.jseUnique = 'unknown'; }
			if (req.body.language) { newUser.language = JSE.jseFunctions.cleanString(req.body.language); } else { newUser.language = 'unknown'; }
			if (req.body.timeOffset) { newUser.timeOffset = JSE.jseFunctions.cleanString(req.body.timeOffset); } else { newUser.timeOffset = 'unknown'; }
			newUser.regip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
			if (newUser.regip.indexOf(',') > -1) { newUser.regip = newUser.regip.split(',')[0]; }
			newUser.lastip = newUser.regip;
			if (req.body.regTime && req.body.regTime < 5000) {
				console.log('Bot registration detected via regTime of '+req.body.regTime+'ms from '+newUser.regip);
		    const failed = {};
				failed.fail = 1;
				failed.notification = 'Bot detected and blocked from registration attempt';
				res.status(400).send(JSON.stringify(failed));
				return;
			}
			// check for anonymous IP address
			if (JSE.jseTestNet) console.log('Result from iphub failed using backup');
			if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(newUser.regip) && JSE.anonymousIPs.indexOf(newUser.regip) > -1) {
				console.log('Bot registration detected via anonymousIP from '+newUser.regip);
		    const failed = {};
				failed.fail = 1;
				failed.notification = 'Anonymous IP address blocked from registration attempt, please disconnect from VPN, Proxy or Tor';
				res.status(400).send(JSON.stringify(failed));
				return;
			}
			newUser.siteids = {};
			newUser.subids = {};
			const keyPair = JSE.jseFunctions.createKeyPair();
			newUser.privateKey = keyPair.privateKey;
			newUser.publicKey = keyPair.publicKey;
			newUser.balance = 0;
			newUser.localcurrency = 'USD';
			if (newUser.country === 'GB') { newUser.localcurrency = 'GBP'; }
			if (newUser.country === 'FR') { newUser.localcurrency = 'EUR'; }
			if (newUser.country === 'DE') { newUser.localcurrency = 'EUR'; }
			if (newUser.country === 'ES') { newUser.localcurrency = 'EUR'; }
			if (newUser.country === 'IT') { newUser.localcurrency = 'EUR'; }
			if (newUser.country === 'IE') { newUser.localcurrency = 'EUR'; }
			newUser.localbalance = 0;
			newUser.registrationDate = new Date().getTime();
			newUser.hit = 0;
			newUser.unique = 0;
			newUser.hash = 0;
			newUser.coin = 0; //pub earnings
			newUser.history = [];
			newUser.locked = false;
			newUser.daily = {}; // daily stats, copied to .stats and reset at midnight
			newUser.stats = [];
			newUser.mining = [];
			newUser.confirmed = false;
			newUser.confirmCode = JSE.jseFunctions.randString(12);
			newUser.apiKey = JSE.jseFunctions.randString(32);
			newUser.apiLevel = 0;
			newUser.twoFactorAuth = false;
			newUser.authKey = authenticator.generateKey();
			newUser.lastLogin = new Date().getTime();
			newUser.invested = 0;
			const geoObject = geoDB.get(newUser.regip);
			if (geoObject && geoObject.country) {
				newUser.geo = geoObject.country.iso_code;
			} else {
				newUser.geo = 'XX';
			}
			newUser.welcomeBonus = 0.12;
			JSE.jseDataIO.checkUniqueEmail(newUser,function(newUserR1) {
				JSE.jseDataIO.reserveUID(newUserR1,function(newUserR2) {
					JSE.jseDataIO.addUser(newUserR2, function(newUserR3) {
						if (newUserR3.fail) { res.status(400).send(newUserR3); return false; }
						JSE.jseDataIO.checkDuplicate(newUserR3,function(newUserR4) {
							// Only runs if it's not a duplicate ip or jseUnique
							JSE.jseFunctions.sendWelcomeEmail(newUserR4);
							JSE.jseDataIO.getCredentialsByUID(0,function(distributionCredentials) {
								jseAPI.apiTransfer(distributionCredentials,newUserR4,newUserR4.welcomeBonus,'Welcome Bonus',false,function(jsonResult) { });
							});
						},function(){
							JSE.jseDataIO.setVariable('account/'+newUserR3.uid+'/duplicate',true); // this is used by confirm.js for referral payments
						});
						// send back safeUser
						const safeUser = JSE.jseFunctions.genSafeUser(newUserR3);
						res.send(JSON.stringify(safeUser));
						console.log('New user: '+newUserR3.email+', From: '+newUserR3.campaign);
						return false;
					}, function(returnObject) { // addUser failCallback()
						res.send(returnObject);
					});
				});
			}, function(returnObject) { // checkUniqueEmail failCallback()
				res.send(returnObject);
			});
    } else {
	    const failed = {};
			failed.fail = 1;
			failed.notification = 'Recaptcha Error 468, Please Try Again';
			res.status(400).send(JSON.stringify(failed));
    }
  });
});

module.exports = router;
