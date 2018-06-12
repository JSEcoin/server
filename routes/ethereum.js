const JSE = global.JSE;
const Web3 = require('web3');
const express = require('express');

const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'+JSE.credentials.infuraAPIKey));
const router = express.Router();

/**
 * @name /ethereum/getdepositaddress/*
 * @description Either setup a new deposit eth address or get an existing one from credentials
 * @memberof module:jseRouter
 */
router.post('/getdepositaddress/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 554. No Session Variable Supplied For 2fa Setup"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials.ethAddress) {
			res.send('{"success":1,"notification":"Your ethereum deposit address is '+goodCredentials.ethAddress+'","ethAddress":"'+goodCredentials.ethAddress+'"}');
		} else {
			// no eth address present, lets set one up
			const ethKeyPair = web3.eth.accounts.create();
			JSE.jseDataIO.setVariable('credentials/'+goodCredentials.uid+'/ethPrivateKey',ethKeyPair.privateKey);
			JSE.jseDataIO.setVariable('lookupETH/'+ethKeyPair.address,goodCredentials.uid);
			JSE.jseDataIO.setVariableThen('credentials/'+goodCredentials.uid+'/ethAddress',ethKeyPair.address,function() {
				res.send('{"success":1,"notification":"Your ethereum deposit address is '+ethKeyPair.address+'","ethAddress":"'+ethKeyPair.address+'"}');
			});
		}
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
	JSE.jseDataIO.getCredentialsBySession(session,function(preGoodCredentials) {
		if (preGoodCredentials && preGoodCredentials.uid > 0) {
			JSE.jseDataIO.checkUserByPublicKey(preGoodCredentials.publicKey,function(goodCredentials) {
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
				const value = JSE.jseFunctions.round(parseFloat(req.body.withdrawalAmount)); // can't clean string because it's not a string
				if (value !== req.body.value) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Security check on value/amount failed"}');
					return false;
				}
				if (goodCredentials.balance < value) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Insufficient Funds"}');
				} else if (goodCredentials.locked && goodCredentials.uid !== 0) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Account locked pending recent transaction, please try again in 20 seconds"}');
					} else if (goodCredentials.suspended && goodCredentials.suspended !== 0) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: This user account has been suspended. Please contact investigations@jsecoin.com"}');
				} else if (value < 0.000001) {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Transfer value is negative or too small"}');
				} else if (value === 0 || value === null || value === '' || typeof value === 'undefined') {
					res.status(400).send('{"fail":1,"notification":"Withdraw Failed: Transfer value zero"}');
				} else {
					const dataObject = {};
					dataObject.publicKey = goodCredentials.publicKey;
					dataObject.user1 = goodCredentials.uid;
					dataObject.command = 'withdraw';
					const withdrawalAddress = JSE.jseFunctions.cleanString(String(req.body.withdrawalAddress));
					dataObject.withdrawalAddress = withdrawalAddress;
					dataObject.value = value;
					dataObject.ts = new Date().getTime();
					dataObject.status = 'pending';
					JSE.jseDataIO.pushBlockData(dataObject,function(blockData) {
						JSE.jseDataIO.minusBalance(goodCredentials.uid,value);
						JSE.jseDataIO.pushVariable('withdrawals/'+goodCredentials.uid,dataObject,function(pushRef) {}); // need to add withdrawals {} to datastore
						JSE.jseDataIO.pushVariable('history/'+goodCredentials.uid,dataObject,function(pushRef) {});
						res.send('{"success":1,"notification":"Withdrawal Success: Pending manual confirmation"}');
					});
				}
				return false;
			});
		}
	});
	return false;
});


module.exports = router;
