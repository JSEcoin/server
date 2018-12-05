const JSE = global.JSE;
const express = require('express');
const jseLottery = require("./../modules/lottery.js");
const maxmind = require('maxmind');

const geoDB = maxmind.openSync('./geoip/GeoIP2-Country.mmdb'); // actually in ../geoip but this is run from ../server.js

const router = express.Router();

const uniqueSiteIDsPerUser = {};

router.get('/', (req, res) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.send(JSE.jseSettings.loader);
});

/**
 * @name /load/*
 * @description Load the publisher miner javascript code
 * @example http://load.jsecoin.com/load/{uid}/{siteid}/{subid}/0/
 * @memberof module:jseRouter
 */
router.get('/:uid/:siteid/:subid/:spare/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Cache-Control', 'no-cache');
	const uid = req.params.uid.split(/[^0-9]/).join('');
	let siteid = JSE.jseFunctions.cleanString(req.params.siteid);
	const subid = JSE.jseFunctions.cleanString(req.params.subid);
	if (siteid === 'http:' || siteid === 'https:') {
		const siteidSplit = req.originalUrl.split('/');
		siteid = siteidSplit[siteidSplit.length -2];
	}
	let visitorIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (visitorIP.indexOf(',') > -1) { visitorIP = visitorIP.split(',')[0]; }
	if (visitorIP.indexOf(':') > -1) { visitorIP = visitorIP.split(':').slice(-1)[0]; }
	if (!JSE.apiLimits[visitorIP]) {
		JSE.apiLimits[visitorIP] = 1;
	} else {
		JSE.apiLimits[visitorIP] += 1;
	}
	const geoObject = geoDB.get(visitorIP);
	let geo = 'XX';
	if (geoObject && geoObject.country) {
		geo = geoObject.country.iso_code;
	}
	try {
		const loaderWithId = JSE.jseSettings.loader.split('unknownpubid').join(uid).split('unknownsiteid').join(siteid).split('unknownsubid').join(subid).split('unknownuserip').join(visitorIP).split('unknowngeo').join(geo);
		res.setHeader('content-type', 'text/javascript');
		if (req.cookies && req.cookies.optout && req.cookies.optout === "1") {
			res.send('console.log("JSEcoin Opted Out");');
		} else if (req.cookies && req.cookies.optin && req.cookies.optin !== 1) { // if 1 then show privacy notice again to get authKey
			const optedInLoader = loaderWithId.split('unknownOptInAuthKey').join(req.cookies.optin).split('unknownMinerAuthKey').join(JSE.minerAuthKey);
			res.send(optedInLoader);
		} else {
			const loaderWithMinerKey = loaderWithId.split('unknownMinerAuthKey').join(JSE.minerAuthKey);
			res.send(loaderWithMinerKey);
		}
		if (uniqueSiteIDsPerUser[siteid]) {
			if (uniqueSiteIDsPerUser[siteid] !== uid) return false;
		} else {
			uniqueSiteIDsPerUser[siteid] = uid;
		}

		if (JSE.apiLimits[visitorIP] < 30) {
			jseLottery.credit(uid,siteid,subid,'hit');
		}
	} catch (ex) {
		console.log('Load error routes/load.js 33 '+ex);
	}
	return false;
});

// V1 Fallback with out subid http://jsecoin.com/load/{uid}/{siteid}/
router.get('/:uid/:siteid/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Cache-Control', 'no-cache');
	const uid = req.params.uid.split(/[^0-9]/).join('');
	let siteid = req.params.siteid; // security?
	if (siteid === 'http:' || siteid === 'https:') {
		// hacky little fix for bad formatted urls
		const siteidSplit = req.originalUrl.split('/');
		siteid = siteidSplit[siteidSplit.length -2];
	}
	let visitorIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (visitorIP.indexOf(',') > -1) { visitorIP = visitorIP.split(',')[0]; }
	if (visitorIP.indexOf(':') > -1) { visitorIP = visitorIP.split(':').slice(-1)[0]; }
	if (!JSE.apiLimits[visitorIP]) {
		JSE.apiLimits[visitorIP] = 1;
	} else {
		JSE.apiLimits[visitorIP] += 1;
	}
	const geoObject = geoDB.get(visitorIP);
	let geo = 'XX';
	if (geoObject && geoObject.country) {
		geo = geoObject.country.iso_code;
	}
	try {
		const loaderWithId = JSE.jseSettings.loader.split('unknownpubid').join(uid).split('unknownsiteid').join(siteid).split('unknownuserip').join(visitorIP).split('unknowngeo').join(geo);
		res.setHeader('content-type', 'text/javascript');
		if (req.cookies && req.cookies.optout && req.cookies.optout === "1") {
			res.send('console.log("JSEcoin Opted Out");');
		} else if (req.cookies && req.cookies.optin && req.cookies.optin !== 1) {
			const optedInLoader = loaderWithId.split('unknownOptInAuthKey').join(req.cookies.optin).split('unknownMinerAuthKey').join(JSE.minerAuthKey);
			res.send(optedInLoader);
		} else {
			const loaderWithMinerKey = loaderWithId.split('unknownMinerAuthKey').join(JSE.minerAuthKey);
			res.send(loaderWithMinerKey);
		}
		if (uniqueSiteIDsPerUser[siteid]) {
			if (uniqueSiteIDsPerUser[siteid] !== uid) return false;
		} else {
			uniqueSiteIDsPerUser[siteid] = uid;
		}
		if (JSE.apiLimits[visitorIP] < 30) {
			jseLottery.credit(uid,siteid,'0','hit');
		}
	} catch (ex) {
		console.log('Load error routes/load.js 52 '+ex);
	}
	return false;
});

// backup incase uid/siteid is missing
router.get('/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Cache-Control', 'no-cache');
	try {
		res.setHeader('content-type', 'text/javascript');
		const loaderWithId = JSE.jseSettings.loader;
		if (req.cookies && req.cookies.optout && req.cookies.optout === "1") {
			res.send('console.log("JSEcoin Opted Out");');
		} else if (req.cookies && req.cookies.optin && req.cookies.optin !== 1) {
			const optedInLoader = loaderWithId.split('unknownOptInAuthKey').join(req.cookies.optin).split('unknownMinerAuthKey').join(JSE.minerAuthKey);
			res.send(optedInLoader);
		} else {
			const loaderWithMinerKey = loaderWithId.split('unknownMinerAuthKey').join(JSE.minerAuthKey);
			res.send(loaderWithMinerKey);
		}
	} catch (ex) {
		console.log('Load error routes/load.js 77 '+ex);
	}
	return false;
});

module.exports = router;
