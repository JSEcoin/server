/**
 * @module jseBackup
 * @description 	Secondary backup and json data storage functions, used only by controller.js
 * <h5>Exported</h5>
 *	<ul>
 *		<li>runAtMidnight</li>
 *		<li>runAtMidday</li>
 *		<li>cleanNulls</li>
 *		<li>backupLedger</li>
 *		<li>resetBlockChainFile</li>
 *		<li>storeLogs</li>
 *	</ul>
*/

const JSE = global.JSE;
const fs = require('fs');
const jseMerchant = require("./../modules/merchant.js");
const jseAPI = require("./apifunctions.js");
const jseEmails = require("./emails.js");
const jseEthIntegration = require("./ethintegration.js");

/**
 * @method <h2>runAtMidnight</h2>
 * @description Resets daily stats at midnight each night, publicStats are pushed to dailyPublicStats
 */
function runAtMidnight() {
	const now = new Date();
	// ...at 00:10:00 hours, 10 minutes extra in case of timing fault
	const night = new Date( now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 10, 0 ); // eslint-disable-line
	const msToMidnight = night.getTime() - now.getTime();
	console.log('runAtMidnight set for '+(Math.floor(msToMidnight /60000))+' mins');
	setTimeout(function() {
			processRewards(7); // Move daily rewards across
			// Push JSE.publicStats to dailyJSE.PublicStats
			JSE.publicStats.ts = new Date().getTime();
			JSE.jseDataIO.updatePublicStats();
			JSE.jseDataIO.getVariable('publicStats',function(latestStats) {
				JSE.jseDataIO.pushVariable('dailyPublicStats',latestStats,function(pushRef){ console.log('Pushed across publicStats to dailyPublicStats'); });
				JSE.jseDataIO.resetDailyStats();
			});
			runAtMidnight(); // Then, reset again next midnight.
	}, msToMidnight);
}

/**
 * @method <h2>runAtMidday</h2>
 * @description Runs subscription payments and notifications at midday each day
 */
function runAtMidday() {
	const now = new Date();
	// ...at 00:10:00 hours, 10 minutes extra in case of timing fault
	let noonObject;
	if (now.getHours() < 12) { // start it up later today if need be
		noonObject = new Date( now.getFullYear(), now.getMonth(), now.getDate(), 12, 10, 0 ); // eslint-disable-line
	} else {
		noonObject = new Date( now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 10, 0 ); // eslint-disable-line
	}
	const msToMidday = noonObject.getTime() - now.getTime();
	console.log('runAtMidday set for '+(Math.floor(msToMidday / 60000))+' mins');
	setTimeout(function() {
		runSubscriptions();
		JSE.jseDataIO.deleteVariable('adxCaptchaLog');
		JSE.jseDataIO.deleteVariable('txToday');
		runAtMidday(); // Then, reset again next midnight.
	}, msToMidday);
}

/**
 * @method <h2>runAt5pm</h2>
 * @description Runs autoresponder series
 */
function runAt5pm() {
	const now = new Date();
	let peakTimeObject;
	if (now.getHours() < 17) { // start it up later today if need be
		peakTimeObject = new Date( now.getFullYear(), now.getMonth(), now.getDate(), 17, 10, 0 ); // eslint-disable-line
	} else {
		peakTimeObject = new Date( now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 10, 0 ); // eslint-disable-line
	}
	const msTo5pm = peakTimeObject.getTime() - now.getTime();
	console.log('runAt5pm set for '+(Math.floor(msTo5pm / 60000))+' mins');
	setTimeout(function() {
		if (!JSE.jseTestNet) { // don't want to send emails when testing!
			startAutoresponder();
		}
		runAt5pm(); // Then, reset again next midnight.
	}, msTo5pm);
}

/**
 * @method <h2>startAutoresponder</h2>
 * @description send out welcome email series
 * @todo to ramp up increase maxEmailsPerDay, decrease startID and remove * 2 from nextEmailTS
 */
JSE.emailsToSend = [];
function startAutoresponder() {
	JSE.jseDataIO.getVariable('nextUserID',function(endID) {
		const startID = endID - 50000; // only send to last 50k users, may need to increase
		JSE.jseDataIO.getAdminAccounts(startID,endID,function(users){
			const nowTS =new Date().getTime();
			let maxCount = 0;
			const maxEmailsPerDay = 4000; // can increase this at a later date
			Object.keys(users).forEach(function(i) {
				if (typeof users[i] === 'undefined' || users[i] === null || maxCount > maxEmailsPerDay) return;
				if (users[i].confirmed === true && !users[i].suspended) {
					if (users[i].noNewsletter) return;
					if (jseEmails.suppression.indexOf(users[i].email) > -1) return;
					const aff =  parseInt(users[i].campaign.split(/[^0-9]/).join(''),10);
					if (users[i].source !== 'referral' || (!users[aff] || !users[aff].suspended)) {
						if (users[i].lastEmail) {
							const lastEmailTS = users[i].lastEmail.split(',')[0]; // timestamp,ref
							const lastEmailRef = parseInt(users[i].lastEmail.split(',')[1],10);
							const nextEmailTS = (new Date(Number(lastEmailTS)).getTime()) + (86400000 * lastEmailRef * 2); // i.e. email 4 will be sent 6 days after email 3, remove end figure to speed up
							if (nextEmailTS < nowTS) {
								maxCount += 1;
								const nextEmailRef = Number(lastEmailRef) + 1;
								JSE.emailsToSend.push({ user: users[i], emailRef: nextEmailRef });
							}
						} else {
							maxCount += 1;
							JSE.emailsToSend.push({ user: users[i], emailRef: 1 });
						}
					}
				}
			});
			console.log('Sending autoresponder email series to '+JSE.emailsToSend.length+' users');
			loopThroughEmails();
		});
	});
}

/**
 * @method <h2>loopThroughEmails</h2>
 * @description takes the JSE.emailsToSend array and sends one autoresponder email per half second
 */
function loopThroughEmails() {
	if (JSE.emailsToSend.length > 0) {
		const nextEmailData = JSE.emailsToSend.pop();
		JSE.jseFunctions.sendOnboardingEmail(nextEmailData.user,nextEmailData.emailRef, function() {
			setTimeout(function() { loopThroughEmails(); },500);
		});
	} else {
		console.log('Finished sending autoresponder emails');
	}
}

/**
 * @method <h2>cleanNulls</h2>
 * @description moves all object data to an array and removes any null values
 * @param {object} firebaseObject this was from back when firebase was causing us formatting issues
 * @todo is this required/used now?
 */
function cleanNulls(firebaseObject) {
	const cleanArray = [];
	Object.keys(firebaseObject).forEach(function(i) {
		if (firebaseObject[i] !== null) {
			cleanArray.push(firebaseObject[i]);
		}
	});
	return cleanArray;
}

/**
 * @function <h2>runSubscriptions</h2>
 * @description Gather subscriptions information from merchantSales and send out warning email if due tomorrow
 */
function runSubscriptions() {
	const nowTS = new Date().getTime();
	let timeoutCount = 1;
	JSE.jseDataIO.getVariable('merchantSales/',function(merchantSales) {
		Object.keys(merchantSales).forEach(function(uid) {
			const uidSales = merchantSales[uid];
			Object.keys(uidSales).forEach(function(pushRef) {
				const uidSale = uidSales[pushRef];
				if (typeof uidSale.type !== 'undefined') {
					if (uidSale.type === 'recurring') {
						const payableDateProcessed = new Date(uidSale.payableDate).getTime();
						if (payableDateProcessed < (86400000 + nowTS) && typeof uidSale.cancelledTS === 'undefined') {
							setTimeout(function(uidSaleTO) { // only process one subscription every 30 seconds to avoid double spend
								processSubscription(uidSaleTO);
							}, timeoutCount, uidSale);
							timeoutCount += 30000;
						} else if (payableDateProcessed < (172800000 + nowTS) && uidSale.rebillFrequency !== 'daily' && typeof uidSale.cancelledTS === 'undefined') {
							const subCurrency = uidSale.recurringCurrency || 'JSE';
							JSE.jseFunctions.sendStandardEmail(uidSale.buyerEmail, 'Subscription Due', 'Please note your subscription reference: '+uidSale.reference+' is due tomorrow.<br><br>Your account will be debited '+uidSale.recurringPrice+' '+subCurrency+'<br><br>You can cancel this contract at any time by logging in to the panel');
						}
					} // reccurring sales
				}
			});
		});
	});
}

/**
 * @function <h2>processSubscription</h2>
 * @description Process any due and valid subscriptions via apiTransfer
 * @param {object} uidSale merchantSales/ object due for processing
 */
function processSubscription(uidSale) {
	JSE.jseDataIO.getCredentialsByUID(uidSale.buyerUID, function(buyer) {
		JSE.jseDataIO.getCredentialsByUID(uidSale.sellerUID, function(seller) {
			let thePrice = uidSale.recurringPrice;
			if (uidSale.currency) {
				thePrice = Math.round(uidSale.recurringPrice / JSE.publicStats.exchangeRates[uidSale.currency+'JSE']);
			}
			jseAPI.apiTransfer(buyer,seller,thePrice,'Subscription: '+uidSale.item,false,function(jsonResult) {
				const returnObj = JSON.parse(jsonResult);
				if (returnObj.success === 1) {
					console.log('Processed subscription ref. '+uidSale.reference);
					// update datetime
					const now = new Date();
					let payableDate = {};
					if (uidSale.rebillFrequency === 'daily') {
						payableDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0, 0);
					} else if (uidSale.rebillFrequency === 'weekly') {
						payableDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 11, 0, 0);
					} else if (uidSale.rebillFrequency === 'monthly') {
						payableDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 11, 0, 0);
					} else if (uidSale.rebillFrequency === 'annually') {
						payableDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 11, 0, 0);
					}
					JSE.jseDataIO.setVariable('merchantSales/'+uidSale.reference+'/payableDate', payableDate);
					JSE.jseDataIO.setVariable('merchantPurchases/'+uidSale.purchaseReference+'/payableDate', payableDate);
				} else {
					cancelSubscription(uidSale);
				}
			});
		});
	});
}

/**
 * @function <h2>cancelSubscription</h2>
 * @description Cancell a subscription and notify both the seller and purchaser
 * @param {object} uidSale merchantSales/ object
 */
function cancelSubscription(uidSale) {
	// code duplicated in checkout.js
	const cancelledTS = new Date().getTime();
	JSE.jseDataIO.setVariable('merchantSales/'+uidSale.reference+'/cancelledTS', cancelledTS);
	JSE.jseDataIO.setVariable('merchantPurchases/'+uidSale.purchaseReference+'/cancelledTS', cancelledTS);
	const cancelHTML = 'Subscription reference: '+uidSale.reference+' has now been cancelled due to insufficient funds or a failed transaction. Please log in to the platform for further details.';
	JSE.jseDataIO.getUserByUID(uidSale.sellerUID, function(seller) {
		JSE.jseFunctions.sendStandardEmail(seller.email,'JSEcoin Subscription Cancellation',cancelHTML);
	});
	JSE.jseDataIO.getUserByUID(uidSale.buyerUID, function(buyer) {
		JSE.jseFunctions.sendStandardEmail(buyer.email,'JSEcoin Subscription Cancellation',cancelHTML);
	});
	return false;
}

/**
 * @method <h2>backupLedger</h2>
 * @description Backs up the current ledger of user balances to a JSON file in the data directory
 * @param {object} ledger the current working ledger
 */
function backupLedger(ledger) {
	const rightNow = new Date();
	const blockRef = JSE.jseDataIO.getBlockRef(JSE.blockID);
	fs.writeFile(JSE.dataDirectory+"ledger.json", JSON.stringify(ledger), function(){ });
	fs.writeFile(JSE.dataDirectory+"ledger"+blockRef+".json", JSON.stringify(ledger), function(){ });
}

/**
 * @method <h2>resetBlockChainFile</h2>
 * @description Finalizes the blockchain json file every time the blockchain hits 999 blocks
 */
function resetBlockChainFile() {
	const blockRef = JSE.jseDataIO.getBlockRef(JSE.blockID);
	//currentBlockChain = {};
	let previousBlockReference = blockRef - 1;
	if (previousBlockReference < 0) { previousBlockReference = 0; }
	JSE.jseDataIO.getVariable('blockChain/'+previousBlockReference,function(blockChain) {
		fs.writeFile(JSE.dataDirectory+"blockchain"+previousBlockReference+".json", JSON.stringify(cleanNulls(blockChain)), function() { });
	});
}

/**
 * @method <h2>storeLogs</h2>
 * @description Secondary backup facility, jseBackup.storeLogs(); is called from the modules/blockchain.js file every 30 seconds.
		If we change the block time we need to change the  && rightNow.getSeconds() >= 29 bit
		Uses setTimouts to log data and distribute memory allocation. Not optimized because data is constantly duplicated.
		Need to really append new data as opposed to making hundreds of files.
		Uses A an B files using fileAddition so that if one file gets corrupted during writing out we have the previous one.
*/

function storeLogs() {
	const rightNow = new Date();
	const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
	let fileAddition = false;
	if (rightNow.getSeconds() >= 29 && rightNow.getMinutes() === 1 && (rightNow.getHours() === 1 || rightNow.getHours() === 5 || rightNow.getHours() === 9 || rightNow.getHours() === 13 || rightNow.getHours() === 17 || rightNow.getHours() === 21)) {
		fileAddition = 'A';
	} else if (rightNow.getSeconds() >= 29 && rightNow.getMinutes() === 1 && (rightNow.getHours() === 0 || rightNow.getHours() === 4 || rightNow.getHours() === 8 || rightNow.getHours() === 12 || rightNow.getHours() === 16 || rightNow.getHours() === 20)) {
		fileAddition = 'B';
	}
	if (fileAddition) {
		setTimeout(function() {
			JSE.jseDataIO.buildLedger(function(ledger) {
				fs.writeFile(JSE.logDirectory+"ledger"+yymmdd+fileAddition+".json", JSON.stringify(ledger), function(){});
			});
		}, 30000);
		setTimeout(function() {
			JSE.jseDataIO.getVariable('credentials',function(credentials) {
				fs.writeFile(JSE.logDirectory+"credentials"+yymmdd+fileAddition+".json", JSON.stringify(credentials), function(){});
			});
		}, 150000);
		setTimeout(function() {
			JSE.jseDataIO.getVariable('account',function(account) {
				fs.writeFile(JSE.logDirectory+"account"+yymmdd+fileAddition+".json", JSON.stringify(account), function(){});
			});
		}, 210000);
		if (rightNow.getHours() === 1 || rightNow.getHours() === 8 || rightNow.getHours() === 13 || rightNow.getHours() === 20) {
			setTimeout(function() {
				JSE.jseDataIO.getVariable('exported',function(exported) {
					fs.writeFile(JSE.logDirectory+"exported"+yymmdd+fileAddition+".json", JSON.stringify(exported), function(){});
				});
			}, 90000);
		}
		if (rightNow.getHours() === 1 || rightNow.getHours() === 12) {
			/*
			setTimeout(function() {
				JSE.jseDataIO.getVariable('history',function(history) {
					fs.writeFile(JSE.logDirectory+"history"+yymmdd+fileAddition+".json", JSON.stringify(history), function(){});
				});
			}, 270000);
			*/
			setTimeout(function() {
				JSE.jseDataIO.getVariable('siteIDs',function(siteIDs) {
					fs.writeFile(JSE.logDirectory+"siteIDs"+yymmdd+fileAddition+".json", JSON.stringify(siteIDs), function(){});
				});
			}, 330000);
			setTimeout(function() {
				JSE.jseDataIO.getVariable('subIDs',function(subIDs) {
					fs.writeFile(JSE.logDirectory+"subIDs"+yymmdd+fileAddition+".json", JSON.stringify(subIDs), function(){});
				});
			}, 390000);
			setTimeout(function() {
				JSE.jseDataIO.getVariable('statsTotal',function(statsTotal) {
					fs.writeFile(JSE.logDirectory+"statsTotal"+yymmdd+fileAddition+".json", JSON.stringify(statsTotal), function(){});
				});
			}, 450000);
			setTimeout(function() {
				JSE.jseDataIO.getVariable('merchantSales',function(merchantSales) {
					fs.writeFile(JSE.logDirectory+"merchantSales"+yymmdd+fileAddition+".json", JSON.stringify(merchantSales), function(){});
				});
			}, 510000);
			setTimeout(function() {
				JSE.jseDataIO.getVariable('merchantPurchases',function(merchantPurchases) {
					fs.writeFile(JSE.logDirectory+"merchantPurchases"+yymmdd+fileAddition+".json", JSON.stringify(merchantPurchases), function(){});
				});
			}, 570000);
		}
	}
}

/**
 * @method <h2>processRewards</h2>
 * @description Move the rewards across to the ledger after x days
 * @param howManyDaysBack the number of days previously we want to move the rewards across for default. 7
 */
function processRewards(howManyDaysBack=7) {
	const lastWeek = new Date();
	lastWeek.setDate(lastWeek.getDate()-howManyDaysBack);
	const lastWeekYYMMDD = lastWeek.toISOString().slice(2,10).replace(/-/g,"");
	const lastMonth = new Date();
	lastMonth.setDate(lastMonth.getDate()-28);
	const lastMonthYYMMDD = lastMonth.toISOString().slice(2,10).replace(/-/g,"");
	JSE.jseDataIO.getVariable('rewards',function(rewards) {
		Object.keys(rewards).forEach(function(uid) {
			if (!uid || !rewards[uid]) return; // check for blank uids
			if (rewards[uid][lastWeekYYMMDD] && !rewards[uid][lastWeekYYMMDD].d) {
				if (rewards[uid][lastWeekYYMMDD].s) { // s = self-mining
					const jsePlatformReward = rewards[uid][lastWeekYYMMDD].s;
					JSE.jseDataIO.plusX('ledger/'+uid, jsePlatformReward);
					const newPlatformData = {};
					newPlatformData.command = 'platformReward';
					newPlatformData.reference = 'Platform Mining Reward '+lastWeekYYMMDD;
					newPlatformData.user1 = uid;
					newPlatformData.value = jsePlatformReward;
					newPlatformData.ts = new Date().getTime();
					JSE.jseDataIO.pushBlockData(newPlatformData,function(blockData) {});
					JSE.jseDataIO.pushVariable('history/'+uid,newPlatformData,function(pushRef) {});
				}
				if (rewards[uid][lastWeekYYMMDD].p) { // p = publisher mining
					const jsePublisherReward = rewards[uid][lastWeekYYMMDD].p;
					JSE.jseDataIO.plusX('ledger/'+uid, jsePublisherReward);
					const newPublisherData = {};
					newPublisherData.command = 'publisherReward';
					newPublisherData.reference = 'Publisher Mining Reward '+lastWeekYYMMDD;
					newPublisherData.user1 = uid;
					newPublisherData.value = jsePublisherReward;
					newPublisherData.ts = new Date().getTime();
					JSE.jseDataIO.pushBlockData(newPublisherData,function(blockData) {});
					JSE.jseDataIO.pushVariable('history/'+uid,newPublisherData,function(pushRef) {});
				}
				if (rewards[uid][lastWeekYYMMDD].r) { // r = referral
					const jseReferralReward = rewards[uid][lastWeekYYMMDD].r;
					JSE.jseDataIO.plusX('ledger/'+uid, jseReferralReward);
					const newReferralData = {};
					newReferralData.command = 'referralReward';
					newReferralData.reference = 'Referral Reward '+lastWeekYYMMDD;
					newReferralData.user1 = uid;
					newReferralData.value = jseReferralReward;
					newReferralData.ts = new Date().getTime();
					JSE.jseDataIO.pushBlockData(newReferralData,function(blockData) {});
					JSE.jseDataIO.pushVariable('history/'+uid,newReferralData,function(pushRef) {});
				}
				if (rewards[uid][lastWeekYYMMDD].a) { // a = advertising
					const jseReferralReward = Number(rewards[uid][lastWeekYYMMDD].a).toFixed(2); // micro payments round to two decimals
					JSE.jseDataIO.plusX('ledger/'+uid, jseReferralReward);
					const newReferralData = {};
					newReferralData.command = 'advertisingReward';
					newReferralData.reference = 'Advertising Payment '+lastWeekYYMMDD;
					newReferralData.user1 = uid;
					newReferralData.value = jseReferralReward;
					newReferralData.ts = new Date().getTime();
					JSE.jseDataIO.pushBlockData(newReferralData,function(blockData) {});
					JSE.jseDataIO.pushVariable('history/'+uid,newReferralData,function(pushRef) {});
				}
				JSE.jseDataIO.setVariable('rewards/'+uid+'/'+lastWeekYYMMDD+'/d',true); // d = done
			}
			if (rewards[uid][lastMonthYYMMDD]) {
				JSE.jseDataIO.hardDeleteVariable('rewards/'+uid+'/'+lastMonthYYMMDD); // clean up after one month?
			}
		});
	});
}

/**
 * @method <h2>pushPending</h2>
 * @description Automatically approve pending txLimits and Withdrawals
 */
function pushPending() {
	const oneTransactionPerUser = [];
	JSE.jseDataIO.getVariable('txPending/',function(txPending) {
		Object.keys(txPending).forEach(function(uid) {
			Object.keys(txPending[uid]).forEach(function(pushRef) {
				const tx = txPending[uid][pushRef];
				if (typeof tx.complete === 'undefined' && tx.requireAdmin === true && tx.emailApproved === true && oneTransactionPerUser.indexOf(tx.uid) === -1) {
					oneTransactionPerUser.push(uid);
					const timeGap = Math.round((oneTransactionPerUser.length - 0.9) * 35000); // slightly more than 30 seconds every time.
					setTimeout(() => {
						console.log(`Approved: ${uid} ${tx.command} ${pushRef}`);
						JSE.jseFunctions.txApprove(tx.uid,pushRef,'admin');
					},timeGap);
				}
			});
		});
	});
}

/**
 * @method <h2>enterprisePayments</h2>
 * @description Bill enterprise payments, run every 5 mins from controller.js
 */
function enterprisePayments() {
	JSE.jseDataIO.getVariable('enterprisePayments/due/',function(bill) {
		if (!bill) return false;
		const rightNow = new Date();
		const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
		const ts = new Date().getTime();
		Object.keys(bill).forEach(function(uid) {
			const balancePending = bill[uid];
			if (balancePending > 0) return false; // safety check.
			const possitiveBalancePending = balancePending / -1;
			JSE.jseDataIO.plusX('ledger/'+uid, balancePending);
			JSE.jseDataIO.plusX('ledger/0', possitiveBalancePending);
			const distributionPayment = {};
			distributionPayment.command = 'distributionTransfer';
			distributionPayment.reference = 'Enterprise Payment: '+uid+'/'+ts;
			distributionPayment.user1 = uid;
			distributionPayment.ts = ts;
			JSE.jseDataIO.pushBlockData(distributionPayment,function(blockData) {});
			JSE.jseDataIO.plusX('enterprisePayments/made/'+uid+'/'+yymmdd, possitiveBalancePending);
			return false;
		});
		JSE.jseDataIO.deleteVariable('enterprisePayments/due/');
		return false;
	});
}

/**
 * @method <h2>pendingPayments</h2>
 * @description check for incoming btc/eth transfers in pendingPayment/
 */
function pendingPayments() {
	JSE.jseDataIO.getVariable('pendingPayment/',function(pendingPayment) {
		if (!pendingPayment) return false;
		let rateLimit = 0;
		Object.keys(pendingPayment).forEach(function(pendingRef) {
			console.log('pendingRef '+pendingRef);
			pendingPayment[pendingRef].pendingRef = pendingRef; // eslint-disable-line
			setTimeout(async (checkout) => {
				console.log('chkout pendingRef '+checkout.pendingRef);
				const ts = new Date().getTime();
				let newBalance = 0;
				if (checkout.payCurrency === 'btc') {
					newBalance = await jseEthIntegration.balanceBTC(checkout.payAddress);
				} else if (checkout.payCurrency === 'eth') {
					newBalance = await jseEthIntegration.balanceETH(checkout.payAddress);
				}
				console.log('newBalance '+newBalance);
				if (newBalance >= checkout.payBalance + checkout.payPrice) {
					const successCheckout = checkout;
					successCheckout.received = ts;
					JSE.jseDataIO.setVariableThen(`successPayment/${successCheckout.pendingRef}/`,successCheckout,function() {
						JSE.jseDataIO.hardDeleteVariable(`pendingPayment/${checkout.pendingRef}/`);
					});
					JSE.jseDataIO.getCredentialsByUID(0, async (distCredentials) => {
						const processedPayment = await jseMerchant.processPayment(distCredentials,checkout);
						if (processedPayment && processedPayment.reference) {
							console.log('Payment processed: '+processedPayment.reference);
							JSE.jseDataIO.setVariable(`successPayment/${successCheckout.pendingRef}/reference`,processedPayment.reference);
						}
					});
				} else if (ts > checkout.ts + 7200000) { // 2hrs
					JSE.jseDataIO.setVariableThen(`failedPayment/${checkout.pendingRef}/`,checkout,function() {
						JSE.jseDataIO.hardDeleteVariable(`pendingPayment/${checkout.pendingRef}/`);
					});
				}
			}, rateLimit, pendingPayment[pendingRef]);
			rateLimit += 1000;
		});
		return false;
	});
}

module.exports = {
	runAtMidnight, runAtMidday, runAt5pm, cleanNulls, backupLedger, startAutoresponder, resetBlockChainFile, storeLogs, pushPending, enterprisePayments, pendingPayments,
};
