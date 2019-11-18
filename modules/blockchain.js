/**
 * @module jseBlockChain
 * @description 	Secondary backup and json data storage functions, used only by controller.js
 * <h5>Exported</h5>
 * <ul>
 * <li>createGenesisBlock</li>
 * <li>newBlock</li>
 * <li>blockChangeOver</li>
 * <li>createLedgerSummary</li>
 * <li>setBlockStrin</li>
 * <li>sha256</li>
 * <li>serverMine</li>
 * <li>webMine</li>
 * <li>verifyBlock</li>
 * <li>verifyLedger</li>
 * </ul>
 */

const JSE = global.JSE;
const crypto = require('crypto');
const fs = require('fs');
const jseSchedule = require("./schedule.js");
const jseLottery = require("./lottery.js");

const jseBlockChain = {
	/**
	 * @method <h2>createGenesisBlock</h2>
	 * @description Starts a new blockchain and writes standard settings to database. Only used on initial run.
	 */
	createGenesisBlock() {
		JSE.jseDataIO.setVariable('blockID',0); // first blockID will be 1 because it's always +1
		JSE.jseDataIO.setVariable('blockChain/0',{}); // setup first blockref
		JSE.jseDataIO.buildLedger(function(ledger) {
			let highestUID = 0;
			Object.keys(ledger).forEach(function(uid) {
				if (uid > highestUID) {
					highestUID = uid;
				}
			});
			console.log('### nextUserID set to: '+highestUID+' double check this! ###');
			JSE.jseDataIO.setVariable('nextUserID',highestUID);
		});

		if (JSE.jseTestNet === false) {
			JSE.jseSettings.difficulty = 6;
		} else {
			JSE.jseSettings.difficulty = 4;
		}
		JSE.jseSettings.frequency = 30000;
		JSE.jseSettings.adminEmail = 'admin@jsecoin.com';
		JSE.jseSettings.systemMessage = ''; //'<span style="color:red">System is currently undergoing planned maintenance</span>'
		JSE.jseSettings.loader = fs.readFileSync('./embed/loader.min.js').toString();
		JSE.jseSettings.maxBlockFileSize = 1000; // how many blocks can fit in a blockchain before we restart
		JSE.jseSettings.publisherPayout = 2;
		JSE.jseSettings.platformPayout = 1;
		JSE.jseSettings.publisherWinners = 50;
		JSE.jseSettings.platformWinners = 50;
		JSE.jseSettings.fairResetTime = 60000;
		JSE.jseDataIO.setVariable('jseSettings',JSE.jseSettings);
	},

	/**
	 * @method <h2>newBlock</h2>
	 * @description Creates a new block every 30 seconds, functionality for blockchain summary every 1000 blocks and genesis block fix
	 */
	newBlock() {
		const blockObject = {};
		blockObject.version = JSE.jseVersion;
		blockObject.startTime = new Date().getTime();
		blockObject.frequency = JSE.jseSettings.frequency;
		blockObject.difficulty = JSE.jseSettings.difficulty;
		blockObject.mainChain = true;
		blockObject.input = {}; // ready for data push
		blockObject.server = 'jsecoin'; //JSE.jseSettings.host;
		JSE.jseDataIO.getVariable('blockID',function(result) {
			JSE.blockID = result; // updates global var
			blockObject.blockID = JSE.blockID + 1;
			blockObject.open = true;
			blockObject.blockReference = JSE.jseDataIO.getBlockRef(blockObject.blockID);
			if (JSE.blockID === 0) {
				// Genesis Block
				blockObject.previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
				JSE.jseDataIO.saveNewBlock(blockObject,function(){
					jseBlockChain.blockChangeOver(function(){
						jseBlockChain.createLedgerSummary();
					});
				});
			} else if (((JSE.blockID+1) / JSE.jseSettings.maxBlockFileSize) === (Math.round((JSE.blockID+1) / JSE.jseSettings.maxBlockFileSize))) { // every time the blockchain hits 1000 blocks
				JSE.jseDataIO.setVariable('blockChain/'+JSE.jseDataIO.getBlockRef(JSE.blockID+1),{}); // setup a new blockref
				JSE.jseDataIO.saveNewBlock(blockObject,function(){
					jseBlockChain.blockChangeOver(function(){
						jseBlockChain.createLedgerSummary();
					});
				});
			} else if (((JSE.blockID-1) / JSE.jseSettings.maxBlockFileSize) === (Math.round((JSE.blockID-1) / JSE.jseSettings.maxBlockFileSize))) { // every time the blockchain hits 999 blocks
				// Starting New BlockChain Every 1000 blocks
				console.log('Finalising and writing blockchain JSON');
				JSE.jseDataIO.saveNewBlock(blockObject,function(){
					jseBlockChain.blockChangeOver(function(){
						jseSchedule.resetBlockChainFile();
					});
				});
			} else {
				JSE.jseDataIO.saveNewBlock(blockObject,function(){
					jseBlockChain.blockChangeOver(function() {});
				});
			}
		});
	},

	/**
	 * @method <h2>blockChangeOver</h2>
	 * @description Change over to the next block according to blockID
	 * @param {function} callback function is called once the block has successfully been changed across
	 */
	blockChangeOver (callback) {
		JSE.jseDataIO.newBlockID(function(newBlockID) {
			const bidMinus1 = newBlockID - 1;
			if (bidMinus1 > 0) { // close current block, no more pushing data
				const blockRefMinus1 = JSE.jseDataIO.getBlockRef(bidMinus1);
				JSE.jseDataIO.setVariable('blockChain/'+blockRefMinus1+'/'+bidMinus1+'/open',false);
			}
			jseBlockChain.webMine(newBlockID,function(bidMinus2,nonce,hash){
				JSE.jseDataIO.deleteVariable('currentHashes');
				JSE.jseDataIO.deleteVariable('locked');
				JSE.lockedUIDs = []; // not actually required for controller. nodes reset in modules/socketio.js
				JSE.jseDataIO.solvedBlock(bidMinus2,nonce,hash);
				if (JSE.credentials && JSE.credentials.jseKeyPair && JSE.credentials.jseKeyPair.privateKey) {
					JSE.jseFunctions.signHash(hash, JSE.credentials.jseKeyPair.privateKey,function(signature) {
						const blockRefMinus2 = JSE.jseDataIO.getBlockRef(bidMinus2);
						JSE.jseDataIO.setVariable('blockChain/'+blockRefMinus2+'/'+bidMinus2+'/signature',signature);
						if (JSE.jseTestNet) console.log('Signed solved block, signature: '+signature);
					});
				}
				jseBlockChain.setPreviousPreHash(newBlockID);
				jseSchedule.storeLogs();
				callback();
				setTimeout(function(thisNewBlockID) {
					jseBlockChain.setPreviousPreHash(thisNewBlockID); // recheck for late transactions
					jseLottery.runLottery();
					const thisNewBlockIDMinus2 = thisNewBlockID - 2;
					jseBlockChain.verifyBlockID(thisNewBlockIDMinus2);
				}, 5000, newBlockID);
			});
		});
	},

	/**
	 * @method <h2>createLedgerSummary</h2>
	 * @description Places the ledger as a summary on the first block of every new blockchain file
	 */
	createLedgerSummary () {
		JSE.jseDataIO.buildLedger(function(ledgerObj) {
			const newData = {};
			newData.command = 'summary';
			newData.data = ledgerObj; // adding complete summary as one dataPush
			newData.ts = new Date().getTime();
			JSE.jseDataIO.pushBlockData(newData,function(blockData) {});
		});
	},

	/**
	 * @method <h2>setPreviousPreHash</h2>
	 * @description Take the previous block and convert it to a string for hashing
	 * @param {number} set the previous hash in to the current block to create chronological blockchain
	 */
	setPreviousPreHash (theNewBlockID) {
		const blockMinusOne = theNewBlockID - 1;
		const refMinusOne = JSE.jseDataIO.getBlockRef(blockMinusOne);
		JSE.jseDataIO.getBlock(blockMinusOne,function(block) { // previous block
			const checkedBlock = jseBlockChain.doubleSpendCheck(blockMinusOne, block);
			if (checkedBlock.preHash) delete checkedBlock.preHash; // remove preHash if it's already been set
			const blockJSON = JSON.stringify(checkedBlock);
			const blockPreHash = jseBlockChain.sha256(blockJSON);
			JSE.jseDataIO.setVariable('previousBlockPreHash',blockPreHash);
			JSE.jseDataIO.setVariable('blockChain/'+refMinusOne+'/'+blockMinusOne+'/preHash',blockPreHash);
		});
	},

	/**
	 * @method <h2>doubleSpendCheck</h2>
	 * @description Check to ensure that only one user transaction per block. This should be taken care of on the load servers and client side but this ensures noone is manipulating these controls. Test @ https://jsfiddle.net/vm789eqx/3/#&togetherjs=GRTrSJq87e
	 * @param {number} bid blockID to test
	 * @param {object} blockObjectRaw block object passed across for testing
	 * @todo Currently when this fails it causes the ledger verification to fail because we are burning tokens to ensure noone gains, could be improved
	 */
	doubleSpendCheck(bid,blockObjRaw) {
		const blockObj = blockObjRaw;
		const checkUsers = [];
		if (typeof blockObj.input !== 'undefined') {
			Object.keys(blockObj.input).forEach(function(tid) {
				const command = blockObj.input[tid].command;
				const user1 = blockObj.input[tid].user1;
				if (command !== 'mining' && command !== 'distribution' && command !== 'distributionTransfer' && command !== 'sideChainHash' && command !== 'summary' && command !== 'platformReward'  && command !== 'publisherReward'  && command !== 'referralReward' && user1 !== 0) {
					if (checkUsers.indexOf(user1) === -1) {
						checkUsers.push(user1);
					} else {
						console.log('Double Spend Alert! BID:'+bid+' TID: '+tid+' UID: '+user1);
						const blockRef = JSE.jseDataIO.getBlockRef(bid);
						JSE.jseDataIO.deleteVariable('blockChain/'+blockRef+'/'+bid+'/input/'+tid);
						let badUser = blockObj.input[tid].user1;
						// adjust ledger, ensure noone gains, someone does lose however
						if (command === 'import') {
							JSE.jseDataIO.minusBalance(blockObj.input[tid].user1,blockObj.input[tid].value);
						}
						if (command === 'transfer') {
							badUser = blockObj.input[tid].user2;
							JSE.jseDataIO.minusBalance(blockObj.input[tid].user2,blockObj.input[tid].value);
						}
						if (command === 'deposit') {
							badUser = blockObj.input[tid].user2;
							JSE.jseDataIO.minusBalance(blockObj.input[tid].user2,blockObj.input[tid].value);
						}
						JSE.jseFunctions.sendStandardEmail('james@jsecoin.com','JSEcoin URGENT ERROR','Double spend check failed on block ID. '+bid+' command: '+command+', badUser: '+badUser+', value: '+blockObj.input[tid].value);
						blockObj.input[tid] = {}; // delete variable
					}
				}
			});
		} else {
			console.log('Skipping doubleSpendCheck as no block input');
		}
		return blockObj;
	},

	/**
	 * @method <h2>sha256</h2>
	 * @description Standard sha256 hashing algorithm, uses the crypto module
	 * @param {string} data data string to hash
	 */
	sha256(data) {
		return crypto.createHash('sha256').update(data).digest('hex');
	},

	/**
	 * @method <h2>serverMine</h2>
	 * @description Fallback in case we have no miners or submitted hashes that match current difficulty.
	 * @param {number} targetBlockID blockID to find hash
	 * @param {function} callback this callback is run once a hash is found
	 */
	// Fallback to mining on the server if we have no hashes submitted
	serverMine (targetBlockID,callback) {
		let found = false;
		const blockRef = JSE.jseDataIO.getBlockRef(targetBlockID);
		JSE.jseDataIO.getVariable('blockChain/'+blockRef+'/'+targetBlockID+'/preHash',function(previousBlockPreHash) {
			for (let x = 0; x <= 5000000 && !found; x+=1) {
				const targetTextWithNonce = previousBlockPreHash+','+x;
				const hash = jseBlockChain.sha256(targetTextWithNonce);
				if (hash.substr(0, 3) === '000') { // set dificulty for server mining at 3 to reduce load
					console.log('Block ('+targetBlockID+') Server found: '+hash);
					found = true;
					const foundNonce = x.toString();
					const foundHash = hash.toString();
					callback(targetBlockID,foundNonce,foundHash);
				}
			}
		});
	},

	/**
	 * @method <h2>webMine</h2>
	 * @description Standard webmining using the blockstring to collect hashes from 3rd parties
	 * @param {number} targetBlockID blockID to find hash
	 * @param {function} callback this callback is run once a hash is found
	 */
	webMine (newBlockID, callback) {
		JSE.jseDataIO.getVariable('currentHashes',function(currentHashes) {
			let targetBlockID = newBlockID - 2;
			if (targetBlockID < 1) { targetBlockID = 1; }
			//console.log('Current Hashes: '+JSON.stringify(currentHashes));
			const bestHashes = []; // needs to be in an array to sort
			Object.keys(currentHashes).forEach(function(key) {
				bestHashes.push(currentHashes[key]);
			});
			//console.log('Best Hashes: '+JSON.stringify(bestHashes));
			//console.log('BestHashes Length: '+bestHashes.length)
			if (bestHashes.length !== 0) {
				bestHashes.sort(function(a, b) {
					if (a.localeCompare) {
						return a.localeCompare(b);
					}
					return null;
				});
				JSE.jseDataIO.getBlock(targetBlockID,function(blockObject) {
					const targetPreHash = blockObject.preHash || '0'; // fallback in case can't get preHash data 19/10/2018
					let blockVerified = false;
					for (let i = 0; i < bestHashes.length && blockVerified === false; i+=1) {
						if (bestHashes[i] && bestHashes[i].split) {
							const submissionSplit = bestHashes[i].split(',');
							const subPreHash = submissionSplit[0];
							const subHash = submissionSplit[1];
							const subNonce = submissionSplit[2];
							if (targetPreHash === subPreHash) {
								if (jseBlockChain.verifyBlock(subPreHash,subHash,subNonce)) {
									blockVerified = true;
									console.log('Block('+targetBlockID+') Hash found: '+subHash);
									callback(targetBlockID,subNonce,subHash);
								} else {
									console.log('WebMine Verification Fail ('+targetBlockID+') Trying next hash...');
								}
							} else if (JSE.jseTestNet) {
								console.log('PreHash Match Error');
							}
						}
					}
					// backup just in case only one hash and it doesn't verify
					if (blockVerified === false) {
						console.log('[[[ Could not verify any hashes. Starting hash server ]]]');
						jseBlockChain.serverMine(targetBlockID,callback);
					}
				});
			} else {
				console.log('Starting hash server');
				jseBlockChain.serverMine(targetBlockID,callback);
			}
		});
	},

	/**
	 * @method <h2>verifyBlock</h2>
	 * @description Check block and hash
	 * @param {string} subPreHash preHash sent out to miners
	 * @param {string} subHash hash submitted by miners
	 * @param {string} subNonce nonce added to preHash to generate the submitted hash
	 * @returns {boolean} true/false
	 */
	verifyBlock (subPreHash,subHash,subNonce) {
		if (JSE.blockID === 0) { return true; }
		const targetText = subPreHash+','+subNonce;
		const vHash = jseBlockChain.sha256(targetText);
		if (vHash === subHash) {
			return true;
		}
		console.log('Block verification 216 failed');
		return false;
	},

	/**
	 * @method <h2>verifyBlockID</h2>
	 * @description Check block and hash
	 * @returns {boolean} returns true if valid and false if there is an issue
	 */
	verifyBlockID (vBlockID) {
		JSE.jseDataIO.getBlock(vBlockID,function(blockObjectRaw) {
			if (blockObjectRaw === null) { // happens if datastore dies
				setTimeout(function() { jseBlockChain.newBlock(); }, 180000); // start next block in 3 mins
				return false;
			}
			const blockObject = blockObjectRaw;
			const vHash = blockObject.hash;
			const vNonce = blockObject.nonce;
			const vPreHash = blockObject.preHash;

			delete blockObject.preHash;
			delete blockObject.hash;
			delete blockObject.nonce;
			delete blockObject.signature;

			const blockJSON = JSON.stringify(blockObject);
			//console.log("\n\n"+blockJSON+"\n\n")
			const blockPreHash = jseBlockChain.sha256(blockJSON);
			if (blockPreHash !== vPreHash) { console.log('Prehash issues blockchain.js 274 ('+blockPreHash+'/'+vPreHash+')'); }
			const targetText = blockPreHash+','+vNonce;
			const vCheckHash = jseBlockChain.sha256(targetText);
			if (vHash === vCheckHash || JSE.blockID <= 3) {
				console.log('Block ID: '+vBlockID+' Verified!');
				setTimeout(function() { jseBlockChain.newBlock(); }, (JSE.jseSettings.frequency - 5250) || 24750); // start next block in x - 5.25 seconds, verifyBlockID called 5 secs later
				return true;
			}
			console.log('Block verification 249 failed');
			// Do we want to hit E-stop if block verification fails?
			setTimeout(function() { jseBlockChain.newBlock(); }, (JSE.jseSettings.frequency - 5250) || 24750); // start next block in x - 5.25 seconds
			JSE.jseFunctions.sendStandardEmail('james@jsecoin.com','JSEcoin URGENT ERROR','There is a block verification error on block ID. '+vBlockID);
			return false;
		});
		return false;
	},

	/**
	 * @method <h2>verifyLedger</h2>
	 * @description Check ledger balances against blockchain
	 * @returns {boolean} returns true if valid and false if there is an issue
	 */
	verifyLedger () {
		JSE.jseDataIO.buildLedger(function(ledger) {
			jseSchedule.backupLedger(ledger);
			const vLedger = JSON.parse(JSON.stringify(ledger));
			const blockRef = JSE.jseDataIO.getBlockRef(JSE.blockID);
			JSE.jseDataIO.getVariable('blockChain/'+blockRef+'/',function(currentBlockChain) {
				const blockChain = JSON.parse(JSON.stringify(currentBlockChain));
				//for (const i in blockChain) {
				Object.keys(blockChain).forEach(function(i) {
					const vBlockData = blockChain[i].input;
					//console.log('Sum1. '+JSON.stringify(vBlockData));
					//for (const j in vBlockData) {
					if (typeof vBlockData !== 'undefined') {
						Object.keys(vBlockData).forEach(function(j) {
							const vInputData = vBlockData[j];
							const vCommand = vInputData.command;
							const user1 = parseInt(vInputData.user1,10);
							const tValue = parseFloat(vInputData.value);

							if (vCommand === 'transfer') {
								//console.log('.'+vBlockData[j].value);
								const user2 = parseInt(vInputData.user2,10);
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] + tValue); // reversed because we want to go back to 0
								vLedger[user2] = JSE.jseFunctions.round(vLedger[user2] - tValue);
							}
							if (vCommand === 'distribution') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] - tValue);
							}
							if (vCommand === 'mining') {
								//vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] - tValue); // removed due to pending system
							}
							if (vCommand === 'platformReward') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] - tValue);
							}
							if (vCommand === 'publisherReward') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] - tValue);
							}
							if (vCommand === 'referralReward') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] - tValue);
							}
							if (vCommand === 'advertisingReward') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] - tValue);
							}
							if (vCommand === 'distributionTransfer') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] + tValue);
								vLedger[0] = JSE.jseFunctions.round(vLedger[0] - tValue);
							}
							if (vCommand === 'export') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] + tValue);
							}
							if (vCommand === 'import') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] - tValue);
							}
							if (vCommand === 'withdraw') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] + tValue);
							}
							if (vCommand === 'deposit') {
								vLedger[user1] = JSE.jseFunctions.round(vLedger[user1] - tValue);
							}
							if (vCommand === 'summary') {
								//for (let sumUID in vInputData.data) {
								Object.keys(vInputData.data).forEach(function(sumUID) {
									const sumBalance = vInputData.data[sumUID];
									vLedger[sumUID] = JSE.jseFunctions.round(vLedger[sumUID] - sumBalance);
								});
							}
						});
					}
				});

				// Test vLedger by checking each value is back to zero
				let vTest = true;
				Object.keys(vLedger).forEach(function(key) {
					if (key !== 0) { // JSEcoin Distribution will have balance > 0
						if (vLedger[key] !== 0) {
							console.log(key +': '+vLedger[key]);
							if (vLedger[key] > 2 || vLedger[key] < 2) { // allow for current block mining payouts to go through
								vTest = false;
							}
							// adjust ledger if it doesn't balance to the blockchain, missing mining payments. Firebase dropping requests
							/*
							if (vLedger[key] < 0 && vLedger[key] > -0.01) {
								const positiveValue = vLedger[key] / -1;
								JSE.jseDataIO.plusX('ledger/'+key, positiveValue);
								console.log('Ledger adjustment: '+key+' > '+positiveValue+'JSE');
							}
							*/
						}
					}
				});
				if (vTest === false) {
					console.log('vLedger: Fail');
					JSE.jseFunctions.sendStandardEmail('james@jsecoin.com','JSEcoin vLedger Fail','The ledger did not verify to the blockchain data.');
				} else {
					console.log('vLedger: Pass');
				}
			});
		});
	},
};

 module.exports = jseBlockChain;
