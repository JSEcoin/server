/**
 * @module jseLottery
 * @description Credit 3rd parties with uniques,hits and hashes and then distribute coins to them
 * <h5>Exported</h5>
 * <ul>
 * <li>credit</li>
 * <li>runLottery</li>
 * </ul>
*/

const JSE = global.JSE;

/**
 * @function <h2>getCreditAccount</h2>
 * @description Does a quick look up keeping a chache of recent queries to save network data IO.
 * @param {number} strippedUID User ID
 * @param {function} callback callback with quicklookup object
 */
function getCreditAccount(strippedUID,callback) {
	if (JSE.creditQuickLookup[strippedUID] === null || typeof JSE.creditQuickLookup[strippedUID] === 'undefined') {
		JSE.jseDataIO.getVariable('account/'+strippedUID,function(account) {
			if (account === null) { return false; }
			JSE.creditQuickLookup[strippedUID] = {};
			JSE.creditQuickLookup[strippedUID].mineQuality = account.mineQuality || null;
			if (account.suspended) JSE.creditQuickLookup[strippedUID].suspended = true; // set suspended to boolean
			callback(JSE.creditQuickLookup[strippedUID]);
			return false;
		});
	} else {
		callback(JSE.creditQuickLookup[strippedUID]);
	}
}

/**
 * @method <h2>credit</h2>
 * @description Credit an account with a hit, unique, hash, optin
 * @param {number} uid User ID
 * @param {string} siteid Site ID
 * @param {string} subid Sub ID
 * @param {string} whatRaw What to credit them with i.e. "optin"
 */
function credit(uid,siteid,subid,whatRaw){
	let what = whatRaw;
	//console.log('CREDIT: '+uid+','+siteid+','+what);
	if (what !== 'hit' && what !== 'unique' && what !== 'hash' && what !== 'optin' && what !== 'validate' && what !== 'nolotteryunique' && what !== 'nolotteryhash' && what !== 'nolotteryhit' && what !== 'nolotteryoptin' && what !== 'optinlotteryonly') { return false; }
	const strippedUID = parseFloat(uid);
	if (strippedUID === 0 || strippedUID === null || strippedUID === 'NaN') { return false; }
	getCreditAccount(strippedUID,function(accountLookup) {
		if (accountLookup === null) { return false; } // watch out for wrong affids
		let noLottery = false;
		if (what === 'nolotteryhash') { // fraud measure, add stats but don't enter for lottery
			what = 'hash';
			noLottery = true;
		}
		if (what === 'nolotteryhit') {
			what = 'hit';
			noLottery = true;
		}
		if (what === 'nolotteryunique') {
			what = 'unique';
			noLottery = true;
		}
		if (what === 'nolotteryoptin') {
			what = 'optin';
			noLottery = true;
		}
		if (what !== 'optinlotteryonly') {
			// Added a cache of recent siteIDs and subIDs, keep a list of last 1000 and save a lookup on every hit
			const safeKey = JSE.jseDataIO.genSafeKey(siteid);
			if (safeKey === null) { console.log('Null safeKey '+uid+' / '+siteid+' / '+whatRaw); return false; }
			const dbRef = 'siteIDs/'+strippedUID+'/'+safeKey;
			if (JSE.recentSiteIDs.indexOf(dbRef) === -1) {
				JSE.recentSiteIDs.push(dbRef);
				JSE.recentSiteIDs = JSE.recentSiteIDs.slice(-999);
				JSE.jseDataIO.getVariable(dbRef,function(siteID) {
					if (siteID === null || (siteID && typeof siteID.s === 'undefined')) {
						const newSiteID = {};
						newSiteID.s = JSE.jseFunctions.cleanString(siteid);
						newSiteID.h = 0; // hit
						newSiteID.u = 0; // unique
						newSiteID.a = 0; // hash
						newSiteID.o = 0; // optin
						newSiteID.c = 0; // coin
						newSiteID.v = 0; // validate
						newSiteID.m = true; // advertising/marketing
						JSE.jseDataIO.setVariable('siteIDs/'+strippedUID+'/'+safeKey,newSiteID);
					} else {
						if (what === 'hit') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/h'); }
						if (what === 'unique') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/u'); }
						if (what === 'optin') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/o'); }
						if (what === 'validate') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/v'); }
						if (what === 'hash') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/a'); }
						if (what === 'coin') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/c'); } // this doesn't seem to be used? 6th Sept 2018
					}
				});
			} else {
				if (what === 'hit') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/h'); }
				if (what === 'unique') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/u'); }
				if (what === 'optin') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/o'); }
				if (what === 'validate') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/v'); }
				if (what === 'hash') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/a'); }
				if (what === 'coin') { JSE.jseDataIO.plusOne('siteIDs/'+strippedUID+'/'+safeKey+'/c'); }
			}
			// Same cache system for subids
			const safeKey2 = JSE.jseDataIO.genSafeKey(subid);
			if (safeKey2 === null) { console.log('Null safeKey '+uid+' / '+subid+' / '+whatRaw); return false; }

			const dbRef2 = 'subIDs/'+strippedUID+'/'+safeKey2;
			if (typeof subid !== 'undefined' && subid !== 0 && subid !== 'optionalSubID') { // if they don't set a subid, don't track it
				if (JSE.recentSubIDs.indexOf(dbRef2) === -1) {
					JSE.recentSubIDs.push(dbRef2);
					JSE.recentSubIDs = JSE.recentSubIDs.slice(-999);
					JSE.jseDataIO.getVariable(dbRef2,function(subID) {
						if (subID === null || (subID && typeof subID.s === 'undefined')) {
							const newSubID = {};
							newSubID.s = JSE.jseFunctions.cleanString(subid);
							newSubID.h = 0; // hit
							newSubID.u = 0; // unique
							newSubID.a = 0; // hash
							newSubID.o = 0; // optin
							newSubID.v = 0; // validate
							newSubID.c = 0; // coin
							JSE.jseDataIO.setVariable('subIDs/'+strippedUID+'/'+safeKey2,newSubID);
						} else {
							if (what === 'hit') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/h'); }
							if (what === 'unique') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/u'); JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/h'); }
							if (what === 'optin') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/o'); }
							if (what === 'validate') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/v'); }
							if (what === 'hash') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/a'); }
							if (what === 'coin') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/c'); }
						}
					});
				} else {
					if (what === 'hit') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/h'); }
					if (what === 'unique') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/u'); JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/h'); }
					if (what === 'optin') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/o'); }
					if (what === 'validate') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/v'); }
					if (what === 'hash') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/a'); }
					if (what === 'coin') { JSE.jseDataIO.plusOne('subIDs/'+strippedUID+'/'+safeKey2+'/c'); }
				}
			}
			// statsTotal
			/* not needed as set in adduser
			JSE.jseDataIO.getVariable('statsTotal/'+strippedUID, function(rootQuery) {
				if (rootQuery === null) { JSE.jseDataIO.setVariable('statsTotal/'+strippedUID, {}); }
			});
			*/
			if (what === 'hit') { JSE.jseDataIO.plusOne('statsTotal/'+strippedUID+'/h'); }
			if (what === 'unique') { JSE.jseDataIO.plusOne('statsTotal/'+strippedUID+'/u'); JSE.jseDataIO.plusOne('statsTotal/'+strippedUID+'/h'); }
			if (what === 'optin') { JSE.jseDataIO.plusOne('statsTotal/'+strippedUID+'/o'); }
			if (what === 'validate') { JSE.jseDataIO.plusOne('statsTotal/'+strippedUID+'/v'); }
			if (what === 'hash') { JSE.jseDataIO.plusOne('statsTotal/'+strippedUID+'/a'); }
			if (what === 'coin') { JSE.jseDataIO.plusOne('statsTotal/'+strippedUID+'/c'); }
			// statsToday
			JSE.jseDataIO.getVariable('statsToday/'+strippedUID, function(rootQuery) {
				const blankStats = {};
				blankStats.h = 0;
				blankStats.u = 0;
				blankStats.o = 0;
				blankStats.a = 0;
				blankStats.c = 0;
				if (rootQuery === null) { JSE.jseDataIO.setVariable('statsToday/'+strippedUID, blankStats); }
			});
			if (what === 'hit') { JSE.jseDataIO.plusOne('statsToday/'+strippedUID+'/h'); }
			if (what === 'unique') { JSE.jseDataIO.plusOne('statsToday/'+strippedUID+'/u'); JSE.jseDataIO.plusOne('statsToday/'+strippedUID+'/h'); }
			if (what === 'optin') { JSE.jseDataIO.plusOne('statsToday/'+strippedUID+'/o'); }
			if (what === 'validate') { JSE.jseDataIO.plusOne('statsToday/'+strippedUID+'/v'); }
			if (what === 'hash') { JSE.jseDataIO.plusOne('statsToday/'+strippedUID+'/a'); }
			if (what === 'coin') { JSE.jseDataIO.plusOne('statsToday/'+strippedUID+'/c'); }
		}
		if (noLottery) {
			return false;
		} else if (accountLookup.suspended) {
			return false;
		} else if (typeof accountLookup.mineQuality !== 'undefined' && accountLookup.mineQuality !== null) { // manual method to stop naughty miners
			const rand = Math.random() * 10; //0-9
			if (rand >= accountLookup.mineQuality) {
				return false;
			}
		}
		const lotteryInput = {
			uid: strippedUID, siteid, subid, what,
		};
		if (what === 'hit') {
			//if (Math.random() > 0.995) { // pre lotterys to try to reduce load
				//JSE.jseDataIO.pushVariable('lottery',lotteryInput); // no lottery entry for hits now.
			//}
		} else if (what === 'unique') {
			//if (Math.random() > 0.99) { // increase or remove completely in due course
			//	JSE.jseDataIO.pushVariable('lottery',lotteryInput,function(pushRef) {});
			//}
		} else if (what === 'optin') {
			if (Math.random() > 0.95) { // remove completely in due course
				JSE.jseDataIO.pushVariable('lottery',lotteryInput,function(pushRef) {});
			}
		} else if (what === 'validate') {
				JSE.jseDataIO.pushVariable('lottery',lotteryInput,function(pushRef) {});
		} else if (siteid === 'Platform Mining' && what === 'hash') {
			JSE.jseDataIO.pushVariable('platformLottery',lotteryInput,function(pushRef) {});
		}
		/*
		} else if (what === 'hash') {
			if (Math.random() > 0.99) {
				//JSE.jseDataIO.pushVariable('lottery',lotteryInput); // too open to fraud, asics etc.
			}
		}
		*/
		return false;
	});
	return false;
}

/**
 * @method <h2>runLottery</h2>
 * @description Run the lottery on every block to pick 50 winners from each of the pools and distribute mining rewards.
 */
function runLottery() {
	const rightNow = new Date();
	const blockTime = rightNow.getTime();
	const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
	JSE.jseDataIO.getVariable('lottery',function(lottery) {
		if (lottery !== null) {
			const lotteryArray = [];
			//for (const key in lottery) {
			Object.keys(lottery).forEach(function(key) {
				lotteryArray.push(lottery[key]);
			});
			const shuffledLottery = JSE.jseFunctions.shuffle(lotteryArray);
			const uniquePublishers = [];
			let winners;
			if (shuffledLottery.length < JSE.jseSettings.publisherWinners) { winners = shuffledLottery.length; } else { winners = JSE.jseSettings.publisherWinners; }
			let i = 0;
			let winCount = 0;
			let fupCount = 0;
			let paidOut = 0;
			while (winCount < winners && fupCount < 300) {
			// one win per block max
				fupCount +=1;
				if (typeof shuffledLottery[i] !== 'undefined' && uniquePublishers.indexOf(shuffledLottery[i].uid) === -1) {
					uniquePublishers.push(shuffledLottery[i].uid);
					const newData = {};
					newData.command = 'mining';
					newData.user1 = shuffledLottery[i].uid;
					newData.value = JSE.jseSettings.publisherPayout;
					// setTimeouts used to distribute load on firebase for non-critical stats
					paidOut += JSE.jseSettings.publisherPayout;
					setTimeout(function(stUID,stSiteID,stSubID,stNewData,stBlockTime) { // eslint-disable-line
						//JSE.jseDataIO.plusX('ledger/'+stUID, JSE.jseSettings.publisherPayout);
						JSE.jseDataIO.plusX('rewards/'+stUID+'/'+yymmdd+'/p', JSE.jseSettings.publisherPayout); // p = publisher
						JSE.jseDataIO.plusX('statsTotal/'+stUID+'/c', JSE.jseSettings.publisherPayout);
						JSE.jseDataIO.plusX('statsToday/'+stUID+'/c', JSE.jseSettings.publisherPayout);
						const safeSiteKey = JSE.jseDataIO.genSafeKey(stSiteID);
						JSE.jseDataIO.plusX('siteIDs/'+stUID+'/'+safeSiteKey+'/c', JSE.jseSettings.publisherPayout);
						const safeSubKey = JSE.jseDataIO.genSafeKey(stSubID);
						JSE.jseDataIO.plusX('subIDs/'+stUID+'/'+safeSubKey+'/c', JSE.jseSettings.publisherPayout);
						JSE.jseDataIO.pushBlockData(stNewData,function(blockData) {});
						const newData2 = JSON.parse(JSON.stringify(stNewData));
						newData2.siteid = stSiteID;
						newData2.subid = stSubID;
						newData2.ts = stBlockTime;
						JSE.jseDataIO.pushVariable('mining/'+stUID,newData2,function(pushRef) {});
					}, 4000 + (winCount*100),shuffledLottery[i].uid,shuffledLottery[i].siteid,shuffledLottery[i].subid,newData,blockTime);
					winCount += 1;
				}
				i +=1;
			}
			if (uniquePublishers.length > 4) {
				setTimeout(function(stUniquePublishers) {
					JSE.jseDataIO.miningMaintenance(stUniquePublishers[0]);
					JSE.jseDataIO.miningMaintenance(stUniquePublishers[1]);
					JSE.jseDataIO.miningMaintenance(stUniquePublishers[2]);
					JSE.jseDataIO.miningMaintenance(stUniquePublishers[3]);
				}, 20000,uniquePublishers);
			}
			console.log('Paid out '+JSE.jseFunctions.round(paidOut)+' JSE to '+uniquePublishers.length+' publishers');
			JSE.jseDataIO.deleteVariable('lottery');
		}
	});

	JSE.jseDataIO.getVariable('platformLottery',function(lottery) {
		if (lottery !== null) {
			const lotteryArray = [];
			//for (const key in lottery) {
			const singleUIDCheck = [];
			Object.keys(lottery).forEach(function(key) {
				if (singleUIDCheck.indexOf(lottery[key].uid) === -1) {
					singleUIDCheck.push(lottery[key].uid);
					lotteryArray.push(lottery[key]);
				}
			});
			const shuffledLottery = JSE.jseFunctions.shuffle(lotteryArray);
			const uniquePublishers = [];
			let winners;
			if (shuffledLottery.length < JSE.jseSettings.platformWinners) { winners = shuffledLottery.length; } else { winners = JSE.jseSettings.platformWinners; }
			let i = 0;
			let winCount = 0;
			let fupCount = 0;
			let paidOut2 = 0;
			while (winCount < winners && fupCount < 100) {
				fupCount +=1;
				if (typeof shuffledLottery[i] !== 'undefined' && uniquePublishers.indexOf(shuffledLottery[i].uid) === -1) {
					uniquePublishers.push(shuffledLottery[i].uid);
					const newData = {};
					newData.command = 'mining';
					newData.user1 = shuffledLottery[i].uid;
					newData.value = JSE.jseSettings.platformPayout;
					paidOut2 += JSE.jseSettings.platformPayout;
					setTimeout(function(stUID,stSiteID,stNewData,stBlockTime) { // eslint-disable-line
						//JSE.jseDataIO.plusX('ledger/'+stUID, JSE.jseSettings.platformPayout);
						JSE.jseDataIO.plusX('rewards/'+stUID+'/'+yymmdd+'/s', JSE.jseSettings.platformPayout); // s = self-mining
						JSE.jseDataIO.plusX('statsTotal/'+stUID+'/c', JSE.jseSettings.platformPayout);
						JSE.jseDataIO.plusX('statsToday/'+stUID+'/c', JSE.jseSettings.platformPayout);
						const safeSiteKey = JSE.jseDataIO.genSafeKey(stSiteID);
						JSE.jseDataIO.plusX('siteIDs/'+stUID+'/'+safeSiteKey+'/c', JSE.jseSettings.platformPayout);
						JSE.jseDataIO.pushBlockData(stNewData,function(blockData) {});
						const newData2 = JSON.parse(JSON.stringify(stNewData));
						newData2.siteid = 'Platform Mining';
						newData2.ts = stBlockTime;
						JSE.jseDataIO.pushVariable('mining/'+stUID,newData2,function(pushRef) {});
					}, 4000 + (winCount*100),shuffledLottery[i].uid,shuffledLottery[i].siteid,newData,blockTime);
					winCount += 1;
				}
				i +=1;
			}
			if (uniquePublishers.length > 4) {
				setTimeout(function(stUniquePublishers) {
					JSE.jseDataIO.miningMaintenance(stUniquePublishers[0]);
					JSE.jseDataIO.miningMaintenance(stUniquePublishers[1]);
					JSE.jseDataIO.miningMaintenance(stUniquePublishers[2]);
					JSE.jseDataIO.miningMaintenance(stUniquePublishers[3]);
				}, 20000,uniquePublishers);
			}
			console.log('Paid out '+JSE.jseFunctions.round(paidOut2)+' JSE to '+uniquePublishers.length+' platform miners');
			JSE.jseDataIO.deleteVariable('platformLottery');
		}
	});
}

module.exports = {
	credit, runLottery,
};
