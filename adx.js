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
	.option('-a, --adxstore [value]', 'Authenticated adxstore','http://10.128.0.10:81')
	.option('-t, --testnet [value]', 'Launch the testnet as remote, local or log', false)
	.parse(process.argv);

JSE.jseTestNet = commandLine.testnet;

if (JSE.jseTestNet !== false) console.log('WARNING: RUNNING IN TESTNET MODE - '+JSE.jseTestNet); // idiot check

JSE.jseVersion = 'JSEcoin Ad Exchange v1.9.01';

const fs = require('fs');

JSE.jseSettings = {};
JSE.currentBlockString = '';
JSE.dataStore1 = commandLine.datastore;
JSE.blockStore1 = commandLine.blockstore;
JSE.adxStore1 = commandLine.adxstore;
JSE.logDirectory = 'logs/';
JSE.dataDirectory = 'data/'; // public access for ledger.json and blockchain.json
JSE.publicStats = {};
JSE.publicStats.ts = new Date().getTime();

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
			if (!adxCampaigns) return false;
			const activeCampaigns = [];
			const rightNow = new Date();
			const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
			const intYYMMDD = parseInt(yymmdd,10);
			const exchangeRate = await JSE.jseDataIO.asyncGetVar(`publicStats/exchangeRates/USDJSE`);
			const t1MinBid = 0.1 / exchangeRate; // work out min/max bids in JSE
			const t2MinBid = 0.02 / exchangeRate;
			const maxBid = 10 / exchangeRate;
			const ledger = await JSE.jseDataIO.asyncGetVar(`ledger`);
			Object.keys(adxCampaigns).forEach((uid,k1,a1) => {
				Object.keys(adxCampaigns[uid]).forEach((cid,k2,a2) => {
					if (k1 === a1.length - 1 && k2 === a2.length - 1) {
						setTimeout(() => {
							JSE.jseDataIO.setVariable('adxActiveCampaigns/', activeCampaigns);
						},5000);
					}
					const campaign = adxCampaigns[uid][cid];
					if (!campaign.disabled && !campaign.paused) {
						campaign.active = {};
						if (campaign.currencyUsd) {
							campaign.active.bidPrice = JSE.jseFunctions.round(campaign.bidPrice / exchangeRate);
							campaign.active.dailyBudget = JSE.jseFunctions.round(campaign.dailyBudget / exchangeRate);
						} else {
							campaign.active.bidPrice = campaign.bidPrice;
							campaign.active.dailyBudget = campaign.dailyBudget;
						}
						JSE.jseDataIO.getVariable(`adxAdvStats/${uid}/${yymmdd}/${cid}/j`, (todaySpendRaw) => {
							let todaySpend = 0;
							if (todaySpendRaw !== null) todaySpend = todaySpendRaw;
							const accountBalance = ledger[uid];
							if (campaign.active.dailyBudget > todaySpend && accountBalance > campaign.active.bidPrice) {
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
												campaign.active[banner.size] = true;
												creativeCount += 1;
											}
										});
										if (creativeCount > 0) activeCampaigns.push(campaign);
									}
								}
							}
						});
					}
				});
			});
			resolve(true);
		});
	});
};

const mergeStatsPools = async() => {
	return new Promise((resolve) => {
		JSE.jseDataIO.getVariable('adxPools/', async(adxPools) => {
			if (!adxPools) return false;
			JSE.jseDataIO.deleteVariable('adxPools/');
			const rightNow = new Date();
			const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,""); // could be done with setInterval
			const ts = rightNow.getTime();
			Object.keys(adxPools).forEach(async(pushRef) => {
				const adxPool = adxPools[pushRef];
				Object.keys(adxPool).forEach(async(table) => {
					if (table === 'adxPayments') {
						Object.keys(adxPool.adxPayments).forEach(async(uid) => {
							const balancePending = adxPool.adxPayments[uid];
							console.log('### Balance Transfer: '+uid+' - '+balancePending+' ###');
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
											Object.keys(adxPool[table][advID][ymd][cid][field]).forEach(async(field2) => {
												//console.log(`### Fields ${field}/${field2}/${adxPool[table][advID][ymd][cid][field][field2]}`);
												JSE.jseDataIO.plusX(`${table}/${advID}/${ymd}/${cid}/${field}/${field2}`, adxPool[table][advID][ymd][cid][field][field2]);
												if (table === "adxPubDomains" && field2 === 'i') {
													JSE.jseDataIO.plusX(`adxSites/${ymd}/${field}/i`, adxPool[table][advID][ymd][cid][field].i);
												}
											});
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

const adxRoutine = async() => {
	const startTime = new Date().getTime();
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
	const waitFor1 = await mergeStatsPools();
	const waitFor2 = await findActiveCampaigns();
	//JSE.jseSiteCrawl.startPubCrawl(); // remove for production
	const finishTime = new Date().getTime();
	const timeTaken = ((finishTime - startTime) / 1000).toFixed(2);
	console.log(`adX Refresh: ${timeTaken} secs`);
};

setInterval(async() => {
	adxRoutine();
},  300000); // every 5 mins

setInterval(async() => {
	console.log(`adX CleanUp!`);
	JSE.jseSiteCrawl.startPubCrawl();
	cleanUpAdStats();
},  21600000); // every 6 hours

setTimeout(function() {
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
	adxRoutine();
}, 5000); // wait for db authentication


// Production use to prevent and log any crashes
//if (JSE.jseTestNet === false) {
process.on('uncaughtException', function(err) {
	console.log('UnCaught Exception 83: ' + err);
	console.error(err.stack);
	fs.appendFile(JSE.logDirectory+'critical.txt', err+' / '+err.stack, function(){ });
});
//}

/*
process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection 223: '+reason.stack);
});
*/

console.log(JSE.jseVersion);
