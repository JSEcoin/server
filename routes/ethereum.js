const JSE = global.JSE;
const express = require('express');
const jseEthIntegration = require("./../modules/ethintegration.js");

const router = express.Router();

/**
 * @name /ethereum/getdepositaddress/*
 * @description Either setup a new deposit eth address or get an existing one from credentials
 * @memberof module:jseRouter
 */
router.post('/getdepositaddress/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 554. No Session Variable Supplied For 2fa Setup"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentialsReturned) {
		const goodCredentials = goodCredentialsReturned;
		if (goodCredentials.ethAddress) {
			res.send('{"success":1,"notification":"Your ethereum deposit address is '+goodCredentials.ethAddress+'","ethAddress":"'+goodCredentials.ethAddress+'"}');
		} else {
			// no eth address present, lets set one up
			const ethKeyPair = jseEthIntegration.newKeyPair();
			JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/ethPrivateKey',ethKeyPair.privateKey);
			JSE.jseDataIO.setVariable('lookupETH/'+ethKeyPair.address,goodCredentials.uid);
			JSE.jseDataIO.setVariableThen('credentials/'+goodCredentials.uid+'/ethAddress',ethKeyPair.address,function() {
				res.send('{"success":1,"notification":"Your ethereum deposit address is '+ethKeyPair.address+'","ethAddress":"'+ethKeyPair.address+'"}');
			});
			goodCredentials.ethAddress = ethKeyPair.address;
		}
		jseEthIntegration.addToQueryPool(goodCredentials.uid,goodCredentials.ethAddress);
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error twofa.js 20. No Session Variable Supplied For 2fa Setup"}'); return false;
	});
	return false;
});

/**
 * @name /ethereum/withdraw/*
 * @description Make a withdrawal from the platform to ERC20 contract address
 * @memberof module:jseRouter
 */
router.post('/withdraw/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 554. No Session Variable Supplied For 2fa Setup"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials && goodCredentials.uid > 0) {
			const pin = String(req.body.pin).split(/[^0-9]/).join('');
			let pinAttempts = 0;
			JSE.pinAttempts.forEach((el) => { if (el === goodCredentials.uid) pinAttempts +=1; });
			if (goodCredentials.pin !== pin || pin === null || typeof pin === 'undefined' || pinAttempts > 3) {
				JSE.pinAttempts.push(goodCredentials.uid);
				res.status(400).send('{"fail":1,"notification":"Error 252. Pin number incorrect or blocked, attempt '+(pinAttempts+1)+'/3"}');
				return false;
			}
			JSE.jseDataIO.setVariable('locked/'+goodCredentials.uid,true);
			if (JSE.lockedUIDs.indexOf(goodCredentials.uid) > -1 && goodCredentials.uid !== 0) {
				res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Account '+goodCredentials.uid+' locked pending recent transaction, please try again in 20 seconds"}');
				return false;
			}
			JSE.lockedUIDs.push(goodCredentials.uid);
			if (!req.body.withdrawalAmount) {
				res.status(400).send('{"fail":1,"notification":"Withdraw Failed: No value provided"}');
				return false;
			}
			const withdrawalAmount = JSE.jseFunctions.round(parseFloat(req.body.withdrawalAmount)); // can't clean string because it's not a string
			const ethFee = JSE.jseSettings.ethFee || 120;
			const value = JSE.jseFunctions.round(withdrawalAmount + ethFee);
			if (withdrawalAmount !== req.body.withdrawalAmount) {
				res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Security check on value/amount failed"}');
				return false;
			}

			const txLimit = goodCredentials.txLimit || JSE.jseSettings.txLimit || 2000;
			JSE.jseDataIO.getVariable('txToday/'+goodCredentials.uid, function(txToday) {
				let txCompleted;
				if (txToday === null) {
					txCompleted = 0;
				} else {
					txCompleted = txToday;
				}
				const txLeft = JSE.jseFunctions.round(txLimit - txCompleted);

				// These are double checked after email confirmation in commands.js
				if (goodCredentials.balance < value) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Insufficient Funds"}');
				} else if (txLeft < value) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Daily transaction limit exceeded, please increase your trasnaction limit"}');
				} else if (goodCredentials.locked && goodCredentials.uid !== 0) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Account locked pending recent transaction, please try again in 20 seconds"}');
				} else if (goodCredentials.suspended && goodCredentials.suspended !== 0) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: This user account has been suspended. Please contact investigations@jsecoin.com"}');
				} else if (value < 0.000001) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Transfer value is negative or too small"}');
				} else if (withdrawalAmount < 0.000001) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: withdrawalAmount value is negative or too small"}');
				} else if (value === 0 || value === null || value === '' || typeof value === 'undefined') {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Transfer value zero"}');
				} else {
					/* Note this object is recreated in functinos txApprove before being passed in to the blockchain or history */
					const dataObject = {};
					dataObject.uid = goodCredentials.uid; // uid becomes user1 in blockchain
					dataObject.email = goodCredentials.email;
					dataObject.command = 'withdraw';
					const withdrawalAddress = JSE.jseFunctions.cleanString(String(req.body.withdrawalAddress));
					dataObject.withdrawalAddress = withdrawalAddress;
					dataObject.withdrawalAmount = withdrawalAmount;
					dataObject.ethFee = ethFee;
					dataObject.value = value;
					dataObject.ts = new Date().getTime();
					dataObject.requireEmail = true;
					dataObject.emailApproved = false;
					dataObject.requireAdmin = true;
					dataObject.adminApproved = false;
					dataObject.confirmKey = JSE.jseFunctions.randString(12);
					JSE.jseDataIO.pushVariable('txPending/'+goodCredentials.uid,dataObject,function(pushRef) {
						const confirmLink = 'https://server.jsecoin.com/confirm/tx/'+goodCredentials.uid+'/'+pushRef+'/'+dataObject.confirmKey;
						const withdrawalHTML = `Please click the link below to confirm you wish to make the following withdrawal:<br>
																		${withdrawalAmount} JSE to address: ${withdrawalAddress}<br><br>
																		<a href="${confirmLink}">Confirm this withdrawal</a><br><br>
																		If you did not make this transaction please contact admin@jsecoin.com and change your account password ASAP.<br>`;
						JSE.jseFunctions.sendStandardEmail(goodCredentials.email,'Please confirm JSE withdrawal',withdrawalHTML);
						res.send('{"success":1,"notification":"Withdrawal Success: Pending email confirmation"}');
						console.log('Withdraw: '+dataObject.uid+' - '+dataObject.value+'JSE');
					});
				}
			});
		} else {
			res.status(401).send('{"fail":1,"notification":"Session credentials could not be matched Error: ethereum.js 114"}');
		}
		return false;
	},function() {
		res.status(401).send('{"fail":1,"notification":"Session not recognized Error: ethereum.js 117"}');
	});
	return false;
});


module.exports = router;
