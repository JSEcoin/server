const JSE = global.JSE;
const express = require('express');

const router = express.Router();

/**
 * @name /newsite/*
 * @description Set up a new siteID for publishers
 * @memberof module:jseRouter
 */
router.post('/*', function (req, res) {
	const session = JSE.jseFunctions.cleanString(req.body.session);
	const newSite = JSE.jseFunctions.cleanString(req.body.newSite.split('http://').join('').split('https://').join('').split('www.').join(''));
	const subID = String(req.body.subID).split(/[^ .,@a-zA-Z0-9]/).join('');
	let naughtyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (naughtyIP.indexOf(',') > -1) { naughtyIP = naughtyIP.split(',')[0]; }
	if (naughtyIP.indexOf(':') > -1) { naughtyIP = naughtyIP.split(':').slice(-1)[0]; }
	if (!JSE.apiLimits[naughtyIP]) {
		JSE.apiLimits[naughtyIP] = 1;
	} else {
		JSE.apiLimits[naughtyIP] += 1;
	}
	if (JSE.apiLimits[naughtyIP] > 20) {
		res.status(400).send('{"fail":1,"notification":"Too many site IDs setup at once."}');
	} else if (newSite.indexOf(' ') > -1 || newSite.indexOf('.') === -1 || newSite.length > 50) {
		res.status(400).send('{"fail":1,"notification":"Site ID / Domain invalid"}');
	} else {
		const advertising = req.body.advertising;
		JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
			const newSiteID = {};
			newSiteID.s = newSite; // siteID
			newSiteID.h = 0; // hit
			newSiteID.u = 0; // unique
			newSiteID.o = 0; // optin
			newSiteID.v = 0; // validated
			newSiteID.a = 0; // hash
			newSiteID.c = 0; // coin
			newSiteID.m = advertising; // advertising/marketing
			const safeKey = JSE.jseDataIO.genSafeKey(newSite);
			JSE.jseDataIO.getVariable('siteIDs/'+goodCredentials.uid+'/'+safeKey,function(alreadyExists) {
				if (alreadyExists == null) {
					JSE.jseDataIO.setVariable('siteIDs/'+goodCredentials.uid+'/'+safeKey,newSiteID);
				}
			});
			const newSubID = {};
			newSubID.s = JSE.jseFunctions.cleanString(subID); // subID
			newSubID.h = 0; // hit
			newSubID.u = 0; // unique
			newSubID.o = 0; // optin
			newSubID.v = 0; // validated
			newSubID.a = 0; // hash
			newSubID.c = 0; // coin
			const safeKey2 = JSE.jseDataIO.genSafeKey(subID);
			JSE.jseDataIO.getVariable('subIDs/'+goodCredentials.uid+'/'+safeKey2,function(alreadyExists2) {
				if (alreadyExists2 == null) {
					JSE.jseDataIO.setVariable('subIDs/'+goodCredentials.uid+'/'+safeKey2,newSubID);
				}
			});
			res.send('{"success":1}');
		},function() {
			res.status(401).send('{"fail":1,"notification":"New Site Setup Failed: Incorrect credentials"}');
		});
	}
});

module.exports = router;
