const JSE = global.JSE;
const express = require('express');
const request = require('request');

const router = express.Router();


/**
 * @name /account/saveIPN/*
 * @description Save an IPN URL from merchant setup form.
 * @memberof module:jseRouter
 */
router.post('/saveIPN/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 879. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session, (goodCredentials) => {
		const ipnURL = JSE.jseFunctions.cleanString(req.body.ipnURL);
		if (ipnURL !== req.body.ipnURL) {
			res.status(400).send('{"fail":1,"notification":"Save IPN failed invalid characters in URL would be reformatted."}');
			return false;
		}
		JSE.jseDataIO.pushVariable(`merchantURL/${goodCredentials.uid}/`,ipnURL,function(pushRef) {
			res.send(JSON.stringify({ success: 1, pushRef }));
		});
		return false;
	},function() {
		res.status(401).send('{"fail":1,"notification":"Payment Failed: Session credentials could not be verified."}');
	});
	return false;
});

/**
 * @name /account/lastlogins/*
 * @description Get a users last logins
 * @memberof module:jseRouter
 */
router.post('/lastlogins/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 708. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			JSE.jseDataIO.getVariable('logins/'+goodCredentials.uid, function(logins) {
				res.send(JSON.stringify(logins));
			});
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 716. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 720. Session Variable not recognized"}');
	});
	return false;
});

/**
 * @name /account/togglemail/*
 * @description Turn on/off email transaction notifications and/or newsletter
 * @memberof module:jseRouter
 */
router.post('/toggleemail/:type/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 519. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	const mailType = JSE.jseFunctions.cleanString(req.params.type);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			if (mailType === 'newsletter') {
				JSE.jseDataIO.getVariable('account/'+goodCredentials.uid+'/noNewsletter',function(noNewsletter) {
					if (noNewsletter) {
						JSE.jseDataIO.hardDeleteVariable('account/'+goodCredentials.uid+'/noNewsletter');
						res.send('{"success":1,"notification":"You will now receive the newletter","turnedOn":true}');
					} else {
						JSE.jseDataIO.setVariable('account/'+goodCredentials.uid+'/noNewsletter',true);
						res.send('{"success":1,"notification":"You will not receive the newletter","turnedOff":true}');
					}
				});
			} else if (mailType === 'transaction') {
				JSE.jseDataIO.getVariable('account/'+goodCredentials.uid+'/noEmailTransaction',function(noEmailTransaction) {
					if (noEmailTransaction) {
						JSE.jseDataIO.hardDeleteVariable('account/'+goodCredentials.uid+'/noEmailTransaction');
						res.send('{"success":1,"notification":"You will now receive transaction notifications via email","turnedOn":true}');
					} else {
						JSE.jseDataIO.setVariable('account/'+goodCredentials.uid+'/noEmailTransaction',true);
						res.send('{"success":1,"notification":"You will not receive transaction notifications","turnedOff":true}');
					}
				});
			} else if (mailType === 'globalresubscribe') {
				const apiURL = 'https://api.sendgrid.com/v3/suppression/unsubscribes';
				const objectSend = { emails: [goodCredentials.email] };
				request.delete({
					url: apiURL,
					json: objectSend,
					headers: {
						Authorization: 'Bearer ' +JSE.credentials.sendgridAPIKey,
					},
				}, (err, res2, result) => {
					console.log('Global Resubscribe: '+goodCredentials.email);
					res.send('{"success":1,"notification":"Email removed from global unsubscribe list"}');
				});
			}
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 573. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 577. Session Variable not recognized"}');
	});
	return false;
});

/**
 * @name /account/setpin/*
 * @description Set a pin number in credentials
 * @memberof module:jseRouter
 */
router.post('/setpin/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 519. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			if (goodCredentials.pin) {
				res.status(400).send('{"fail":1,"notification":"Error index.js 524. Pin number has already been set"}');
			} else {
				const pin = String(req.body.pin).split(/[^0-9]/).join('');
				if (pin.length >= 4 && pin.length <= 12 && pin !== '1234' && pin !== '0000') {
					JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/pin',pin);
					res.send('{"success":1,"notification":"Pin number has been successfully set.<br><br>Thank you for helping secure your JSEcoin account."}');
				} else {
					res.status(400).send('{"fail":1,"notification":"Error index.js 531. Pin number not secure, must be 4-12 digits"}');
				}
			}
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 526. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 530. Session Variable not recognized"}');
	});
	return false;
});

/**
 * @name /account/updatedetails/*
 * @description Update the users account details, name and address
 * @memberof module:jseRouter
 */
router.post('/updatedetails/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 717. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		const pin = String(req.body.pin).split(/[^0-9]/).join('');
		let pinAttempts = 0;
		JSE.pinAttempts.forEach((el) => { if (el === goodCredentials.uid) pinAttempts +=1; });
		if (pinAttempts > 3) {
			res.status(400).send('{"fail":1,"notification":"Error 264. Account locked three incorrect attempts at pin number, please check again in six hours"}');
			return false;
		} else if (goodCredentials.pin !== pin || pin === null || typeof pin === 'undefined') {
			JSE.pinAttempts.push(goodCredentials.uid);
			res.status(400).send('{"fail":1,"notification":"Error 268. Pin number incorrect or blocked, attempt '+(pinAttempts+1)+'/3"}');
			return false;
		}
		if (goodCredentials !== null) {
			JSE.jseDataIO.setVariable('account/'+goodCredentials.uid+'/name',JSE.jseFunctions.cleanString(req.body.newName));
			JSE.jseDataIO.setVariable('account/'+goodCredentials.uid+'/address',JSE.jseFunctions.cleanString(req.body.newAddress));
			res.send('1');
		} else {
			res.send('0');
		}
		return false;
	}, function() {
		res.send('0');
	});
	return false;
});


/**
 * @name /account/updateapilevel/*
 * @description Update the users API level to either 0 - Disabled, 1 - Read Access, 2 - Write Access
 * @memberof module:jseRouter
 */
router.post('/updateapilevel/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error indedx.js 225. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		const pin = String(req.body.pin).split(/[^0-9]/).join('');
		let pinAttempts = 0;
		JSE.pinAttempts.forEach((el) => { if (el === goodCredentials.uid) pinAttempts +=1; });
		if (pinAttempts > 3) {
			res.status(400).send('{"fail":1,"notification":"Error 231. Account locked three incorrect attempts at pin number, please check again in six hours"}');
			return false;
		} else if (goodCredentials.pin !== pin || pin === null || typeof pin === 'undefined') {
			JSE.pinAttempts.push(goodCredentials.uid);
			res.status(400).send('{"fail":1,"notification":"Error 235. Pin number incorrect or blocked, attempt '+(pinAttempts+1)+'/3"}');
			return false;
		}
		if (goodCredentials !== null) {
			JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/apiLevel',parseFloat(req.body.newAPILevel));
			res.send('1');
		} else {
			res.send('0');
		}
		return false;
	}, function() {
		res.send('0');
	});
	return false;
});


/**
 * @name /account/getapikey/*
 * @description Update the users API Key
 * @memberof module:jseRouter
 */
router.post('/getapikey/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error indedx.js 258. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		const pin = String(req.body.pin).split(/[^0-9]/).join('');
		let pinAttempts = 0;
		JSE.pinAttempts.forEach((el) => { if (el === goodCredentials.uid) pinAttempts +=1; });
		if (pinAttempts > 3) {
			res.status(400).send('{"fail":1,"notification":"Error 295. Account locked three incorrect attempts at pin number, please check again in six hours"}');
			return false;
		} else if (goodCredentials.pin !== pin || pin === null || typeof pin === 'undefined') {
			JSE.pinAttempts.push(goodCredentials.uid);
			res.status(400).send('{"fail":1,"notification":"Error 299. Pin number incorrect or blocked, attempt '+(pinAttempts+1)+'/3"}');
			return false;
		}
		if (goodCredentials !== null) {
			res.send('{"success":1,"apiKey":"'+goodCredentials.apiKey+'"}');
		}
		return false;
	});
	return false;
});

/**
 * @name /account/resetapikey/*
 * @description Update the users API Key
 * @memberof module:jseRouter
 */
router.post('/resetapikey/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error indedx.js 258. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		const pin = String(req.body.pin).split(/[^0-9]/).join('');
		let pinAttempts = 0;
		JSE.pinAttempts.forEach((el) => { if (el === goodCredentials.uid) pinAttempts +=1; });
		if (pinAttempts > 3) {
			res.status(400).send('{"fail":1,"notification":"Error 295. Account locked three incorrect attempts at pin number, please check again in six hours"}');
			return false;
		} else if (goodCredentials.pin !== pin || pin === null || typeof pin === 'undefined') {
			JSE.pinAttempts.push(goodCredentials.uid);
			res.status(400).send('{"fail":1,"notification":"Error 299. Pin number incorrect or blocked, attempt '+(pinAttempts+1)+'/3"}');
			return false;
		}
		if (goodCredentials !== null) {
			const newAPIKey = JSE.jseFunctions.randString(32);
			JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/apiKey',newAPIKey);
			JSE.jseDataIO.setVariable('lookupAPIKey/'+newAPIKey,goodCredentials.uid);
			JSE.jseDataIO.hardDeleteVariable('lookupAPIKey/'+goodCredentials.apiKey); // clean up old key lookup tables
			res.send('{"success":1,"notification":"API Key Updated","newAPIKey":"'+newAPIKey+'"}');
		}
		return false;
	});
	return false;
});

/**
 * @name /account/enterprisepayments/*
 * @description Return a list of payments made by ddmmyy
 * @memberof module:jseRouter
 */
router.post('/enterprisepayments/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 229. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			JSE.jseDataIO.getVariable(`enterprisePayments/made/${goodCredentials.uid}`, function(enterprisePayments) {
				const forcedObj = enterprisePayments || {};
				res.send(JSON.stringify(forcedObj));
			});
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 237. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 241. Session Variable not recognized"}');
	});
	return false;
});


/**
 * @name /account/updatetxlimit/*
 * @description Update the transaction limit
 * @memberof module:jseRouter
 */
router.post('/updatetxlimit/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error indedx.js 630. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		const pin = String(req.body.pin).split(/[^0-9]/).join('');
		let pinAttempts = 0;
		JSE.pinAttempts.forEach((el) => { if (el === goodCredentials.uid) pinAttempts +=1; });
		if (pinAttempts > 3) {
			res.status(400).send('{"fail":1,"notification":"Error 637. Account locked three incorrect attempts at pin number, please check again in six hours"}');
			return false;
		} else if (goodCredentials.pin !== pin || pin === null || typeof pin === 'undefined') {
			JSE.pinAttempts.push(goodCredentials.uid);
			res.status(400).send('{"fail":1,"notification":"Error 641. Pin number incorrect or blocked, attempt '+(pinAttempts+1)+'/3"}');
			return false;
		}
		const newTxLimit = parseFloat(req.body.newTxLimit);
		if (!(typeof newTxLimit === 'number' && newTxLimit >= 0)) {
			res.status(400).send('{"fail":1,"notification":"New transaction limit not recognised, please input a new transaction limit in the box provided"}');
			return false;
		}
		JSE.jseDataIO.getVariable('ledger/'+goodCredentials.uid,function(balance) {
			if (newTxLimit > balance) {
				res.status(400).send('{"fail":1,"notification":"Can not set a transaction limit greater than your current account balance"}');
				return false;
			}
			if (newTxLimit <= 10000) {
				JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/txLimit',newTxLimit);
				res.send('{"success":1,"notification":"Transaction Limit Updated"}');
				return false;
			}
			const dataObject = {};
			dataObject.uid = goodCredentials.uid;
			dataObject.email = goodCredentials.email;
			dataObject.command = 'txlimit';
			dataObject.newTxLimit = newTxLimit;
			dataObject.currentTxLimit = goodCredentials.txLimit || JSE.jseSettings.txLimit || 2000;
			dataObject.ts = new Date().getTime();
			dataObject.requireEmail = true;
			dataObject.emailApproved = false;
			if (newTxLimit <= 100000) {
				dataObject.requireAdmin = false;
			} else {
				dataObject.requireAdmin = true;
				dataObject.adminApproved = false;
			}
			dataObject.confirmKey = JSE.jseFunctions.randString(12);

			JSE.jseDataIO.pushVariable('txPending/'+goodCredentials.uid,dataObject,function(pushRef) {
				const confirmLink = 'https://server.jsecoin.com/confirm/tx/'+goodCredentials.uid+'/'+pushRef+'/'+dataObject.confirmKey;
				const withdrawalHTML = `Please click the link below to confirm you wish to adjust your transaction limit to:<br>
																${dataObject.newTxLimit} JSE<br><br>
																<a href="${confirmLink}">Confirm new transaction limit</a><br><br>
																If you did not make this transaction please contact admin@jsecoin.com and change your account password ASAP.<br>`;
				JSE.jseFunctions.sendStandardEmail(goodCredentials.email,'Please confirm new JSE transaction limit',withdrawalHTML);
				res.send('{"success":1,"notification":"Transaction limit will update after email confirmation","emailRequired":true}');
				return false;
			});
			return false;
		});
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 652. Session key not recognized"}');
	});
	return false;
});

/**
 * @name /account/txtoday/*
 * @description Get a users txToday figure for transaction limit calculations, this shows how much he has used.
 * @memberof module:jseRouter
 */
router.post('/txtoday/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 708. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			JSE.jseDataIO.getVariable('txToday/'+goodCredentials.uid, function(txToday) {
				const returnObject = {};
				returnObject.success = 1;
				returnObject.txToday = txToday || 0;
				returnObject.txLimit = goodCredentials.txLimit || JSE.jseSettings.txLimit || 2000;
				res.send(JSON.stringify(returnObject));
			});
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 716. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 720. Session Variable not recognized"}');
	});
	return false;
});

/**
 * @name /account/referrals/*
 * @description Get Referrals
 * @memberof module:jseRouter
 */
router.post('/referrals/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 696. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			JSE.jseDataIO.getVariable('referrals/'+goodCredentials.uid, function(referrals) {
				res.send(JSON.stringify(referrals)); // null is checked for clientside
			});
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 139. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 142. Session Variable not recognized"}');
	});
	return false;
});

/**
 * @name /account/delete/*
 * @description Delete account permanently :(
 * @memberof module:jseRouter
 */
router.post('/delete/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 696. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
				const now = new Date().getTime();
				JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/suspended',now);
				JSE.jseDataIO.setVariable('account/'+goodCredentials.uid+'/suspended',now);
				JSE.jseDataIO.setVariable('account/'+goodCredentials.uid+'/name','Account Deleted');
				JSE.jseDataIO.setVariable('account/'+goodCredentials.uid+'/email','deleted@jsecoin.com');
				JSE.jseDataIO.setVariable('account/'+goodCredentials.uid+'/address','deleted');
				const deletedPassword = JSE.jseFunctions.sha256(Math.random());
				JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/passwordHashed',deletedPassword);
				console.log('Account Deleted '+goodCredentials.uid);
				res.send('{"success":1}');
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 139. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 142. Session Variable not recognized"}');
	});
	return false;
});

/**
 * @name /account/pubstats/*
 * @description Get Publisher Stats
 * @memberof module:jseRouter
 */
router.post('/pubstats/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 696. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			JSE.jseDataIO.getPubStats(goodCredentials.uid, function(pubStats) { // pubStats.statsDaily pubStats.subIDs pubStats.siteIDs
				JSON.stringify(pubStats);
				res.send(JSON.stringify(pubStats)); // need to check for null value?
			});
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 139. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 142. Session Variable not recognized"}');
	});
	return false;
});

/**
 * @name /account/removestats/*
 * @description Remove siteIDs or subIDs Stats
 * @memberof module:jseRouter
 */
router.post('/removestats/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 543. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	const safeKey = JSE.jseDataIO.genSafeKey(req.body.ref);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null && safeKey.length > 0) { // double check we aren't deleting all the site/subIDs
			if (req.body.what === 'siteIDs') {
				JSE.jseDataIO.hardDeleteVariable('siteIDs/'+goodCredentials.uid+'/'+safeKey);
			} else if (req.body.what === 'subIDs') {
				JSE.jseDataIO.hardDeleteVariable('subIDs/'+goodCredentials.uid+'/'+safeKey);
			}
			res.send('{"success":1,"notification":"Stat successfully removed"}');
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 549. Session variable or reference not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 553. Session Variable not recognized"}');
	});
	return false;
});


/**
 * @name /account/myexports/*
 * @description Return a list of exported coin objects
 * @memberof module:jseRouter
 */
router.post('/myexports/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 696. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			const myExports = [];
			JSE.jseDataIO.getMyExportedCoins(goodCredentials.uid, function(exportedCoins) {
				res.send(JSON.stringify(exportedCoins)); // need to check for null value?
			});
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 64. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 67. Session Variable not recognized"}');
	});
	return false;
});

/**
 * @name /account/removecoincode/*
 * @description Set coinobject.removed = true which will prevent the user from retrieving the coincode in future. Can be an unused coincode for privacy.
 * @memberof module:jseRouter
 */
router.post('/removecoincode/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 696. No Session Variable"}'); return false; }
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials !== null) {
			const coinCode = JSE.jseFunctions.cleanString(req.body.coinCode);
			JSE.jseDataIO.getVariable('exported/'+coinCode, function(eCoin) {
				if (eCoin.uid === goodCredentials.uid) {
					JSE.jseDataIO.setVariable('exported/'+coinCode+'/removed',true);
					res.send('{"success":1,"notification":"Coincode has been removed"}');
				}
			});
		} else {
			res.status(401).send('{"fail":1,"notification":"Error index.js 64. Session Variable not recognized"}');
		}
		return false;
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error index.js 67. Session Variable not recognized"}');
	});
	return false;
});


module.exports = router;
