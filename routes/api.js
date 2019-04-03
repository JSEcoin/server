const JSE = global.JSE;
const express = require('express');
const request = require('request');
const jseAPI = require("./../modules/apifunctions.js");
const jseCommands = require("./../modules/commands.js");

const router = express.Router();

if (JSE.authenticatedNode) {
	/**
	 * @name /api/transfer/*
	 * @description API Transfer Function
	 * @example https://api.jsecoin.com/transfer/:apiKey/:toEmailOrPublicKey/:toAmount/:toReference/*
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/transfer/:apiKey/:toEmailOrPublicKey/:toAmount/:toReference/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const toPubKey = req.params.toEmailOrPublicKey; // Can be email or public key
		const toEmail = req.params.toEmailOrPublicKey.toLowerCase(); // email needs to be lower case
		const toAmount = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(req.params.toAmount)));
		const toReference = JSE.jseFunctions.cleanString(req.params.toReference).substring(0, 255);
		JSE.jseDataIO.getCredentialsByAPIKey(apiKey,function(goodCredentials) {
			if (!(goodCredentials.apiLevel >= 2)) { res.status(400).send('{"fail":1,"notification":"API key does not have write access"}'); return false; }
			if (toEmail.indexOf('@') > -1) {
				JSE.jseDataIO.getUserByEmail(toEmail,function(toUser) {
					jseAPI.apiTransfer(goodCredentials,toUser,toAmount,toReference,false,function(jsonResult){
						res.send(jsonResult);
					});
				}, function() {
					res.status(400).send('{"fail":1,"notification":"API Transfer Failed: User receiving funds unknown"}');
				});
			} else {
				JSE.jseDataIO.getUserByPublicKey(toPubKey,function(toUser) {
					jseAPI.apiTransfer(goodCredentials,toUser,toAmount,toReference,true,function(jsonResult){
						res.send(jsonResult);
					});
				}, function() {
					res.status(400).send('{"fail":1,"notification":"API Transfer Failed: User receiving funds unknown"}');
				});
			}
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API Transfer Failed: User API key credentials could not be found"}');
		});
		return false;
	});

/**
 * @name /api/export/*
 * @description API Export Function
 * @example https://api.jsecoin.com/export/:apiKey/:exportAmount/*
 * @memberof module:jseRouter
 * @param {object} req Express Request object
 * @param {object} res Express Result object
 */
	router.get('/export/:apiKey/:exportAmount/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const exportAmount = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(req.params.exportAmount)));
		JSE.jseDataIO.getCredentialsByAPIKey(apiKey,function(goodCredentials) {
			if (!(goodCredentials.apiLevel >= 2)) { res.status(400).send('{"fail":1,"notification":"API key does not have write access"}'); return false; }
			jseAPI.apiExport(goodCredentials,exportAmount,function(jsonResult){
				res.send(jsonResult);
			});
			return false;
		}, function(){
			res.status(401).send('{"fail":1,"notification":"API Export Failed: User API key credentials could be found"}');
		});
		return false;
	});

	/**
	 * @name /api/import/*
	 * @description API Import Function
	 * @example https://api.jsecoin.com/import/:apiKey/:coinCode/*
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/import/:apiKey/:coinCode/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const coinCode = JSE.jseFunctions.cleanString(req.params.coinCode);
		JSE.jseDataIO.getCredentialsByAPIKey(apiKey,function(goodCredentials) {
			if (!(goodCredentials.apiLevel >= 2)) { res.status(400).send('{"fail":1,"notification":"API key does not have write access"}'); return false; }
				jseCommands.importCoinCode(coinCode, goodCredentials.uid,function(returnJSON) {
					res.send(returnJSON);
				});
				return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API Export Failed: User API key credentials could not be matched"}');
		});
		return false;
	});

	/**
	 * @name /api/balance/*
	 * @description API Balance Query
	 * @example https://api.jsecoin.com/balance/:apiKey/:lookup/*
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/balance/:apiKey/:lookup/*', function(req, res) {
		//console.log('test1');
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const lookup = JSE.jseFunctions.cleanString(req.params.lookup);
		JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
			if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
			jseAPI.apiBalance(credentialCheck,lookup,function(jsonResult){
				res.send(jsonResult);
			});
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API Balance Failed: User API key credentials could not be matched"}');
		});
		return false;
	});

	/**
	 * @name /api/history/*
	 * @description API History Query
	 * @example https://api.jsecoin.com/history/:apiKey/:pageBy?/:pageNo?/*
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/history/:apiKey/:pageBy?/:pageNo?/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
			if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
			jseAPI.apiHistory(credentialCheck,function(jsonResult){
				if (typeof req.params.pageBy !== 'undefined' && typeof req.params.pageNo !== 'undefined') {
					const endRef = parseInt(req.params.pageBy,10) * parseInt(req.params.pageNo,10);
					const startRef = endRef - parseInt(req.params.pageBy,10);
					let historyCount = 0;
					const userAPIHistory = JSON.parse(jsonResult);
					const userHistory = userAPIHistory.history;
					const paginatedHistory = {};
					Object.keys(userHistory).forEach(function(pushKey) {
						if (historyCount >= startRef && historyCount < endRef) {
							paginatedHistory[pushKey] = userHistory[pushKey];
						}
						historyCount += 1;
					});
					userAPIHistory.history = paginatedHistory;
					const paginatedHistoryJSON = JSON.stringify(userAPIHistory);
					res.send(paginatedHistoryJSON);
				} else {
					res.send(jsonResult);
				}
			});
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API History Failed: User API key credentials could not be matched"}');
		});
		return false;
	});

	/**
	 * @name /api/mining/*
	 * @description API Mining Query
	 * @example https://api.jsecoin.com/mining/:apiKey/:pageBy?/:pageNo?/*
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/mining/:apiKey/:pageBy?/:pageNo?/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
			if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
			jseAPI.apiMining(credentialCheck,function(jsonResult){
			if (typeof req.params.pageBy !== 'undefined' && typeof req.params.pageNo !== 'undefined') {
					const endRef = parseInt(req.params.pageBy,10) * parseInt(req.params.pageNo,10);
					const startRef = endRef - parseInt(req.params.pageBy,10);
					let miningCount = 0;
					const userAPIMining = JSON.parse(jsonResult);
					const userMining = userAPIMining.mining;
					const paginatedMining = {};
					Object.keys(userMining).forEach(function(pushKey) {
						if (miningCount >= startRef && miningCount < endRef) {
							paginatedMining[pushKey] = userMining[pushKey];
						}
						miningCount += 1;
					});
					userAPIMining.mining = paginatedMining;
					const paginatedMiningJSON = JSON.stringify(userAPIMining);
					res.send(paginatedMiningJSON);
				} else {
					res.send(jsonResult);
				}
			});
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API Mining Failed: User API key credentials could not be matched"}');
		});
		return false;
	});

	/**
	 * @name /api/currentblockid/*
	 * @description Get the current working block ID
	 * @example https://api.jsecoin.com/currentblockid/:apiKey/*
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/currentblockid/:apiKey/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
			if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
			JSE.jseDataIO.getVariable('blockID',function(blockID){
				res.send('{"success":1,"blockID":"'+blockID+'"}');
			});
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API CurrentBlockID Failed: User API key credentials could not be matched"}');
		});
		return false;
	});

	/**
	 * @name /api/getblock/*
	 * @description Get the block object at given block number
	 * @example https://api.jsecoin.com/getblock/:blockNumber/:apiKey/*
	 * @memberof module:jseRouter
	 */
	router.get('/getblock/:blockNumber/:apiKey/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		if (JSE.apiLimits[apiKey]) {
			JSE.apiLimits[apiKey] += 1;
		} else {
			JSE.apiLimits[apiKey] = 1;
		}
		if (JSE.apiLimits[apiKey] < 300) {
			const targetBlockID = parseFloat(req.params.blockNumber);
			JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
				if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
				JSE.jseDataIO.getBlock(targetBlockID,function(blockObject) {
					const returnObject = {};
					returnObject.success = 1;
					returnObject.block = blockObject;
					res.send(JSON.stringify(returnObject));
				});
				return false;
			}, function() {
				res.status(401).send('{"fail":1,"notification":"API getblock Failed: User API key credentials could not be matched"}');
			});
		} else {
			res.status(400).send('{"fail":1,"notification":"API Limit reached checkemail 300 per 30 mins"}');
		}
		return false;
	});

	/**
	 * @name /api/ledger/*
	 * @description Download public ledger data
	 * @example https://api.jsecoin.com/ledger/:apiKey/:pageBy?/:pageNo?/:sortBy?/*
	 * @memberof module:jseRouter
	 */
	router.get('/ledger/:apiKey/:pageBy?/:pageNo?/:sortBy?/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const targetBlockID = parseFloat(req.params.blockNumber);
		JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
			if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
				JSE.jseDataIO.buildLedger(function(ledger){
					const returnObject = {};
					returnObject.success = 1;
					const sortedLedger = {};
					if (typeof req.params.pageBy !== 'undefined' && typeof req.params.pageNo !== 'undefined') {
						const endRef = parseInt(req.params.pageBy,10) * parseInt(req.params.pageNo,10);
						const startRef = endRef - parseInt(req.params.pageBy,10);
						let ledgerCount = 0;
						if (typeof req.params.sortBy !== 'undefined') {
							if (req.params.sortBy === 'uidDESC') {
								for (let i = Object.keys(ledger).length - 1; i >= 0; i-=1) {
									if (ledgerCount >= startRef && ledgerCount < endRef) {
										sortedLedger[i] = ledger[i];
									}
									ledgerCount += 1;
								}
							} else if (req.params.sortBy === 'balanceASC') {
								const keysSorted = Object.keys(ledger).sort(function(a,b) { return ledger[a]-ledger[b]; });
								Object.keys(keysSorted).forEach(function(uid) {
									if (ledgerCount >= startRef && ledgerCount < endRef) {
										sortedLedger[keysSorted[uid]] = ledger[keysSorted[uid]];
									}
									ledgerCount += 1;
								});
							} else if (req.params.sortBy === 'balanceDESC') {
								const keysSorted2 = Object.keys(ledger).sort(function(a,b) { return ledger[b]-ledger[a]; });
								Object.keys(keysSorted2).forEach(function(uid) {
									if (ledgerCount >= startRef && ledgerCount < endRef) {
										sortedLedger[keysSorted2[uid]] = ledger[keysSorted2[uid]];
									}
									ledgerCount += 1;
								});
							} else {
								Object.keys(ledger).forEach(function(uid) {
									if (ledgerCount >= startRef && ledgerCount < endRef) {
										sortedLedger[uid] = ledger[uid];
									}
									ledgerCount += 1;
								});
							}
						} else {
							Object.keys(ledger).forEach(function(uid) {
								if (ledgerCount >= startRef && ledgerCount < endRef) {
									sortedLedger[uid] = ledger[uid];
								}
								ledgerCount += 1;
							});
						}
						returnObject.ledger = sortedLedger;
					} else {
						Object.keys(ledger).forEach(function(uid) {
							sortedLedger[uid] = ledger[uid];
						});
						returnObject.ledger = sortedLedger;
					}
					res.send(JSON.stringify(returnObject));
				});
				return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API Ledger Failed: User API key credentials could not be matched"}');
		});
		return false;
	});

	/**
	 * @name /api/checkuserid/*
	 * @description Check user ID and return uid, publicKey and balance
	 * @example https://api.jsecoin.com/checkuserid/:uid/:apiKey/*
	 * @memberof module:jseRouter
	 */
	router.get('/checkuserid/:uid/:apiKey/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const targetUID = parseFloat(req.params.uid);
		JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
			if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
			JSE.jseDataIO.getUserByUID(targetUID,function(toUser) {
				JSE.jseDataIO.getVariable('ledger/'+toUser.uid,function(balance){
					const returnObject = {};
					returnObject.success = 1;
					returnObject.uid = toUser.uid;
					returnObject.publicKey = toUser.publicKey;
					returnObject.balance = balance;
					res.send(JSON.stringify(returnObject));
				});
			}, function() {
				res.status(400).send('{"fail":1,"notification":"API checkuserid Failed: user id unknown"}');
			});
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API checkuserid Failed: User API key credentials could not be matched"}');
		});
		return false;
	});

	/**
	 * @name /api/checkpublickey/*
	 * @description Check user by public key and return uid, publicKey and balance
	 * @example https://api.jsecoin.com/checkpublickey/:publicKey/:apiKey/*
	 * @memberof module:jseRouter
	 */
	router.get('/checkpublickey/:publicKey/:apiKey/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const targetPublicKey = JSE.jseFunctions.cleanString(req.params.publicKey);
		JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
			if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
			JSE.jseDataIO.getUserByPublicKey(targetPublicKey,function(toUser) {
				JSE.jseDataIO.getVariable('ledger/'+toUser.uid,function(balance){
					const returnObject = {};
					returnObject.success = 1;
					returnObject.uid = toUser.uid;
					returnObject.publicKey = toUser.publicKey;
					returnObject.balance = balance;
					res.send(JSON.stringify(returnObject));
				});
				return false;
			}, function() {
				res.status(400).send('{"fail":1,"notification":"API checkpublickey Failed: Public Key unknown"}');
			});
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API checkpublickey Failed: User API key credentials could not be matched"}');
		});
		return false;
	});

	/**
	 * @name /api/checkemail/*
	 * @description Check email and return uid, publicKey and balance
	 * @example https://api.jsecoin.com/checkuserid/:uid/:apiKey/*
	 * @memberof module:jseRouter
	 */
	router.get('/checkemail/:email/:apiKey/*', function(req, res) {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		if (JSE.apiLimits[apiKey]) {
			JSE.apiLimits[apiKey] += 1;
		} else {
			JSE.apiLimits[apiKey] = 1;
		}
		if (JSE.apiLimits[apiKey] < 300) {
			JSE.jseDataIO.checkCredentialsByAPIKey(apiKey,function(credentialCheck) {
				if (!(credentialCheck.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
				const targetEmail = JSE.jseFunctions.cleanString(String(req.params.email)).toLowerCase();
				JSE.jseDataIO.getUserByEmail(targetEmail,function(toUser) {
					JSE.jseDataIO.getVariable('ledger/'+toUser.uid,function(balance){
						const returnObject = {};
						returnObject.success = 1;
						returnObject.uid = toUser.uid;
						returnObject.publicKey = toUser.publicKey;
						returnObject.balance = balance;
						res.send(JSON.stringify(returnObject));
					});
				}, function() {
					res.status(400).send('{"fail":1,"notification":"API checkemail Failed: user email unknown"}');
				});
				return false;
			}, function() {
				res.status(400).send('{"fail":1,"notification":"API checkpublickey Failed: User API key credentials could not be matched"}');
			});
		} else {
			res.status(400).send('{"fail":1,"notification":"API Limit reached checkemail 300 per 30 mins"}');
		}
		return false;
	});


	// Anything else, catch all
	router.get('/*', function(req, res) {
		res.status(400).send('{"fail":1,"notification":"Check the API documentation at https://developer.jsecoin.com/ and get your api key from the platform at https://platform.jsecoin.com"}');
		return false;
	});
} else {
	router.get('/*', function(req, res) {
		const rOptions = {};
		if (typeof req.get('Authorization') !== 'undefined') {
			rOptions.headers = {};
			rOptions.headers.apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		}
		rOptions.url = 'https://api.jsecoin.com'+req.originalUrl;
		request(rOptions, function (error, response, body) {
			res.send(body);
		});
		return false;
	});
}

module.exports = router;
