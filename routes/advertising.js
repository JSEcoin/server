const JSE = global.JSE;
const express = require('express');

const router = express.Router();

const fs = require('fs');
const jseAds = require("./../modules/ads.js");

/**
 * @name /advertising/uploadcampaign/*
 * @description Setup a new advertising campaign or edit an existing one
 * @memberof module:jseRouter
 */
router.post('/uploadcampaign/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			// Object destructuring, new fields need to be added before and after the =>
			const campaign = (({
				name, geos, devices, windowsDesktop, macDesktop, androidTablet, ipad, androidPhone, iphone, other, browsers, chrome, firefox, safari, ucbrowser, opera, edge, ie, general, crypto, streaming, adult, domains, domainWhitelist, domainBlacklist, publishers, publisherWhitelist, publisherBlacklist, url, currencyJse, currencyUsd, dailyBudget, lifetimeBudget, bidPrice, start, end, frequencyCap,
			}) => ({
				name, geos, devices, windowsDesktop, macDesktop, androidTablet, ipad, androidPhone, iphone, other, browsers, chrome, firefox, safari, ucbrowser, opera, edge, ie, general, crypto, streaming, adult, domains, domainWhitelist, domainBlacklist, publishers, publisherWhitelist, publisherBlacklist, url, currencyJse, currencyUsd, dailyBudget, lifetimeBudget, bidPrice, start, end, frequencyCap,
			}))(req.body);

			if (campaign.cid) {
				// modify existing campaign
			} else {
				const newDate = new Date().getTime();
				const random = Math.floor((Math.random() * 999999) + 1); // setting up a firebase style push variable, timestamp+random
				campaign.cid = String(newDate) +''+ String(random); // Campaign ID
				campaign.uid = goodCredentials.uid;
				campaign.paused = false; // user paused
				campaign.disabled = 'pending'; // admin disabled (budgets etc)
				campaign.archived = false;
			}
			campaign.banners = [];
			Object.keys(req.body.creatives).forEach((imgRef) => {
				let base64Data;
				let fileName;
				const size = req.body.creatives[imgRef].size;
				const originalFileName = JSE.jseFunctions.cleanString(req.body.creatives[imgRef].originalFileName);
				if (size === '300x100' || size === '728x90' || size === '300x250') {
					if (/^data:image\/png;base64,/.test(req.body.creatives[imgRef].src)) {
						base64Data = req.body.creatives[imgRef].src.replace(/^data:image\/png;base64,/, "");
						fileName = goodCredentials.uid+'_'+campaign.cid+'_'+imgRef+'.png';
					} else if (/^data:image\/gif;base64,/.test(req.body.creatives[imgRef].src)) {
						base64Data = req.body.creatives[imgRef].src.replace(/^data:image\/gif;base64,/, "");
						fileName = goodCredentials.uid+'_'+campaign.cid+'_'+imgRef+'.gif';
					} else if (/^data:image\/jpeg;base64,/.test(req.body.creatives[imgRef].src)) {
						base64Data = req.body.creatives[imgRef].src.replace(/^data:image\/jpeg;base64,/, "");
						fileName = goodCredentials.uid+'_'+campaign.cid+'_'+imgRef+'.jpg';
					}
					if (fileName) {
						if (base64Data.length < 250000) {
							JSE.jseDataIO.storeFile('adx',fileName,base64Data,'base64');
							campaign.banners.push({ fileName, size, originalFileName, paused: false, disabled: 'pending' });
						} else {
							console.log("Error advertising.js 40. File size too large");
						}
					}
				} else {
					// inText creatives here?
					console.log("Error advertising.js 44. Unrecognized file size detected");
				}
			});

			//fs.writeFileSync('./campaign1.json', JSON.stringify(campaign) , 'utf-8');
			JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+campaign.cid,campaign);

			res.send('{"success":1,"notification":"Campaign has been successfully submitted"}');
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 19. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/getcampaigns/*
 * @description Get campaign data
 * @memberof module:jseRouter
 */
router.post('/getcampaigns/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.getVariable('adxCampaigns/'+goodCredentials.uid+'/', function(campaigns) {
				res.send(JSON.stringify(campaigns));
			});
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 89. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/getadvstats/*
 * @description Get basic advertising stats data
 * @memberof module:jseRouter
 */
router.post('/getadvstats/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.getVariable('adxAdvStats/'+goodCredentials.uid+'/', function(result) {
				res.send(JSON.stringify(result));
			});
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 109. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /storeclick/:postback/*
 * @description Store a click in localStorage for global tracking pixel
 * @memberof module:jseRouter
 */
router.get('/storeclick/:advid/:postback/*', function(req, res) {
	const js = `<script>
		localStorage.setItem('postback'+${req.params.advid}, ${req.params.postback});
	</script>`;
	res.send(js);
});

/**
 * @name /globalpixel/*
 * @description Global pixel url <img src="https://load.jsecoin.com/advertising/globalpixel/?aid=145&value=1" />
 * @memberof module:jseRouter
 */
router.get('/globalpixel/*', function(req, res) {
	const js = `<script>
		if (localStorage && localStorage.postback${req.query.aid}) {
			var postback = localStorage.postback${req.query.aid};
			var value = ${req.query.value || 1};
			(new Image()).src = 'https://load.jsecoin.com/advertising/s2spixel/?aid=${req.query.aid}&value='+value+'&postback='+postback;
		}
	</script>`;
	res.send(js);
});

/**
 * @name /s2spixel/*
 * @description s2s postback url
 * @memberof module:jseRouter
 */
router.get('/s2spixel/*', async(req, res) => {
	const aid = String(req.query.aid).split(/[^0-9]/).join('');
	const value = String(req.query.value).split(/[^0-9.]/).join('') || 1;
	const postback = String(req.query.postback).split(/[^0-9]/).join('');
	let found = false;
	if (aid && value && postback && (postback + value + aid).length < 1000) {
		const rightNow = new Date();
		for (let i = 0; i < 7 && found === false; i += 1) { // 0-6 = 7 days
			rightNow.setDate(rightNow.getDate()-0);
			const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
			const adImpression = await JSE.jseDataIO.asyncGetVar(`adxClicks/${aid}/${postback}`); // eslint-disable-line
			if (adImpression) {
				jseAds.logAdStat(adImpression,'k');
				found = true;
			}
		}
	}
	if (found) {
		res.send(1);
	} else {
		res.send(0);
	}
});

/**
 * @name /advertising/stats/:report/*
 * @description Routes for adx stats
 * @memberof module:jseRouter
 */
router.post('/stats/:report/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session;
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			const report = JSE.jseFunctions.cleanString(req.params.report);
			if (report === 'adxAdvStats' || report === 'adxAdvDomains' || report === 'adxAdvPubIDs' || report === 'adxAdvCreatives' || report === 'adxAdvGeos' || report === 'adxAdvDevices' || report === 'adxAdvBrowsers' || report === 'adxPubStats' || report === 'adxPubDomains' || report === 'adxPubSubIDs' || report === 'adxPubAdvIDs' || report === 'adxPubGeos' || report === 'adxPubDevices' || report === 'adxPubPlacements') {
				JSE.jseDataIO.getVariable(report+'/'+goodCredentials.uid,function(returnObject) {
					res.send(returnObject);
				});
			}
		}
	});
	return false;
});

module.exports = router;
