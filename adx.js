/**
 * @file adx.js
 * @name JSE Ad Exchange
 * @example forever start -c "node --max-old-space-size=3000" adx.js &
 * @example "node adx.js -t local -d http://localhost:82 -e http://localhost:83 -a http://localhost:84
 * @version 1.9.01
 * @description The ad exchange controls and maintains the ad exchange campaigns
 */

const JSE = {};
global.JSE = JSE;

const commandLine = require('commander');

commandLine
	.option('-c, --credentials [value]', 'Credentials file location','./credentials.json')
	.option('-d, --datastore [value]', 'Authenticated datastore','http://10.128.0.5')
	.option('-e, --blockstore [value]', 'Authenticated blockstore','http://10.128.0.6')
	.option('-a, --adxstore [value]', 'Authenticated adxstore','http://10.128.0.7')
	.option('-t, --testnet [value]', 'Launch the testnet as remote, local or log', false)
	.parse(process.argv);

JSE.jseTestNet = commandLine.testnet;

if (JSE.jseTestNet !== false) console.log('WARNING: RUNNING IN TESTNET MODE - '+JSE.jseTestNet); // idiot check

JSE.jseVersion = 'JSEcoin Ad Exchange v1.9.01';

const fs = require('fs');

JSE.jseSettings = {};
JSE.logDirectory = 'logs/';
JSE.dataDirectory = 'data/'; // public access for ledger.json and blockchain.json

if (fs.existsSync(commandLine.credentials)) {
	JSE.credentials = require(commandLine.credentials); // eslint-disable-line
	JSE.authenticatedNode = true;
} else {
	JSE.credentials = false;
	JSE.authenticatedNode = false;
}

JSE.jseFunctions = require('./modules/functions.js'); // round robin bug means has to be JSE
JSE.jseDataIO = require('./modules/dataio.js'); // can't call initialiseApp twice from modules
JSE.jseSiteCrawl = require('./modules/sitecrawl.js');

const findActiveCampaigns = async() => {
	return new Promise((resolve) => {
		JSE.jseDataIO.getVariable('adxCampaigns/', async(adxCampaigns) => {
			const activeCampaigns = [];
			const rightNow = new Date();
			const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
			const intYYMMDD = parseInt(yymmdd,10);
			const exchangeRate = await JSE.jseDataIO.asyncGetVar(`publicStats/exchangeRates/USDJSE`);
			const t1MinBid = 0.1 / exchangeRate; // work out min/max bids in JSE
			const t2MinBid = 0.02 / exchangeRate;
			const maxBid = 10 / exchangeRate;
			Object.keys(adxCampaigns).forEach(async(uid) => {
				Object.keys(adxCampaigns[uid]).forEach(async(cid) => {
					const campaign = adxCampaigns[uid][cid];
					if (!campaign.disabled && !campaign.paused) {
						campaign.active = {};
						if (campaign.currencyUsd) {
							campaign.active.bidPrice = campaign.bidPrice * exchangeRate;
							campaign.active.dailyBudget = campaign.dailyBudget * exchangeRate;
						} else {
							campaign.active.bidPrice = campaign.bidPrice;
							campaign.active.dailyBudget = campaign.dailyBudget;
						}
						const todaySpend = await JSE.jseDataIO.asyncGetVar(`adxAdvStats/${uid}/${yymmdd}/${cid}/j`);
						const accountBalance = await JSE.jseDataIO.asyncGetVar(`ledger/${uid}`);
						if (campaign.active.dailyBudget < todaySpend && accountBalance > campaign.active.bidPrice) {
							campaign.active.budgetLeft = campaign.active.dailyBudget - todaySpend; // might be useful for tapering out campaigns when approaching budget
							if (campaign.active.budgetLeft > campaign.active.bidPrice) {
								if ((intYYMMDD > parseInt(campaign.start,10) || !campaign.start) && (intYYMMDD < parseInt(campaign.end,10) || !campaign.end)) {
									campaign.geos.forEach((geo) => {
										if ('US,CA,UK,GB,AU,NZ'.indexOf(geo) && campaign.active.bidPrice > t1MinBid && campaign.active.bidPrice < maxBid) {
											campaign.active[geo] = true;
										} else if (campaign.active.bidPrice > t2MinBid && campaign.active.bidPrice < maxBid) {
											campaign.active[geo] = true;
										}
									});
									let creativeCount = 0;
									campaign.banners.forEach((banner) => {
										if (!campaign.banners.disabled && !campaign.banners.paused) {
											campaign.active[campaign.banners[banner].size] = true;
											creativeCount += 1;
										}
									});
									if (creativeCount > 0) activeCampaigns.push(campaign);
								}
							}
						}
					}
				});
			});
			JSE.jseDataIO.setVariable('adxActiveCampaigns/', activeCampaigns);
			resolve(true);
		});
	});
};

const mergeStatsPools = async() => {
	return new Promise((resolve) => {
		JSE.jseDataIO.getVariable('adxPools/', async(adxPools) => {
			JSE.jseDataIO.deleteVariable('adxPools/');
			const rightNow = new Date();
			const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,""); // could be done with setInterval
			const ts = rightNow.getTime();
			Object.keys(adxPools).forEach(async(pushRef) => {
				const adxPool = adxPools[pushRef];
				Object.keys(adxPool).forEach(async(table) => {
					if (table === 'adxClicks') {
						Object.keys(adxPool[table]).forEach(async(impressionID) => {
							JSE.jseDataIO.setVariable('adxClicks/'+yymmdd+'/'+impressionID, adxPool.adxClicks[impressionID]); // this may need optimizing
						});
					} else if (table === 'adxPayments') {
						Object.keys(adxPool[table]).forEach(async(uid) => {
							const balancePending = adxPool.adxPayments[uid];
							if (balancePending > 0) {
								JSE.jseDataIO.plusX('rewards/'+uid+'/'+yymmdd+'/a', balancePending);
							} else if (balancePending < 0) {
								const possitiveBalancePending = balancePending / -1;
								JSE.jseDataIO.plusX('ledger/'+uid, balancePending);
								JSE.jseDataIO.plusX('ledger/'+0, possitiveBalancePending);
								const distributionPayment = {};
								distributionPayment.command = 'distributionTransfer';
								distributionPayment.reference = 'Advertising Payment: '+uid+'/'+ts;
								distributionPayment.user1 = uid;
								distributionPayment.value = possitiveBalancePending;
								distributionPayment.ts = ts;
								JSE.jseDataIO.pushBlockData(distributionPayment,function(blockData) {});
							}
						});
					} else {
						Object.keys(adxPool[table]).forEach(async(advID) => {
							Object.keys(adxPool[table][advID]).forEach(async(ymd) => {
								Object.keys(adxPool[table][advID][ymd]).forEach(async(cid) => {
									Object.keys(adxPool[table][advID][ymd][cid]).forEach(async(field) => {
										if (table === 'adxAdvStats' || table === 'adxPubStats') {
											JSE.jseDataIO.plusX(`${table}/${advID}/${ymd}/${cid}/${field}`, adxPool[table][advID][ymd][cid][field]);
										} else if (table === 'adxAdvDomains' || table === 'adxAdvPubIDs' || table === 'adxAdvCreatives' || table === 'adxAdvGeos' || table === 'adxAdvDevices' || table === 'adxAdvBrowsers' || table === 'adxPubDomains' || table === 'adxPubSubIDs' || table === 'adxPubAdvIDs' || table === 'adxPubGeos' || table === 'adxPubDevices' || table === 'adxPubPlacements') { // safety check, only modify adx stats data
											Object.keys(adxPool[table][advID][ymd][cid]).forEach(async(field2) => {
												JSE.jseDataIO.plusX(`${table}/${advID}/${ymd}/${cid}/${field}/${field2}`, adxPool[table][advID][ymd][cid][field][field2]);
											});
											if (table === "adxPubDomains" && adxPool[table][advID][ymd][cid][field].i) {
												JSE.jseDataIO.plusX(`adxSites/${ymd}/${field}/i`, adxPool[table][advID][ymd][cid][field].i);
											}
										}
									});
								});
							});
						});
					}
				});
			});
			resolve(true);
		});
	});
};

const cleanUpAdStats = async() => {
	const rightNow = new Date();
	rightNow.setDate(rightNow.getDate()-7); // delete ad clicks from 7 days ago
	const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
	JSE.jseDataIO.hardDeleteVariable('adxClicks/'+yymmdd+'/');
	JSE.jseDataIO.hardDeleteVariable('adxSites/'+yymmdd+'/');
};

setInterval(async() => {
	const startTime = new Date().getTime();
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
	const waitFor1 = await mergeStatsPools();
	const waitFor2 = await findActiveCampaigns();
	const finishTime = new Date().getTime();
	const timeTaken = Math.round((finishTime - startTime) / 1000);
	console.log(`adX Refresh: ${timeTaken} secs`);
},  300000); // every 5 mins

setInterval(async() => {
	console.log(`adX CleanUp!`);
	JSE.jseSiteCrawl.startPubCrawl();
	cleanUpAdStats();
},  21600000); // every 6 hours

setTimeout(function() {
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
	findActiveCampaigns();
}, 5000); // wait for db authentication


// Production use to prevent and log any crashes
if (JSE.jseTestNet === false) {
	process.on('uncaughtException', function(err) {
		console.log('UnCaught Exception 83: ' + err);
		console.error(err.stack);
		fs.appendFile(JSE.logDirectory+'critical.txt', err+' / '+err.stack, function(){ });
	});
}
console.log(JSE.jseVersion);