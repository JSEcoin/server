const JSE = global.JSE;
const express = require('express');

const router = express.Router();

/**
 * @name /newsite/*
 * @description Set up a new siteID for publishers
 * @memberof module:jseRouter
 */
router.post('/*', function (req, res) {
	const session = req.body.session;
	let newSite = String(req.body.newSite);
	let subID = String(req.body.subID);
	newSite = newSite.split('http://').join('').split('https://').join('').split('www.').join('');
	subID = String(subID).split(/[^ .,@a-zA-Z0-9]/).join('');
	const advertising = req.body.advertising;
	JSE.jseDataIO.getCredentialsBySession(req.body.session,function(goodCredentials){
		const newSiteID = {};
		newSiteID.s = JSE.jseFunctions.cleanString(newSite); // siteID
		newSiteID.h = 0; // hit
		newSiteID.u = 0; // unique
		newSiteID.o = 0; // optin
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
});

module.exports = router;
