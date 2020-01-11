const JSE = global.JSE;
const express = require('express');

const router = express.Router();

if (JSE.authenticatedNode) {
	/**
	 * @name /enterprise/ipcheck/:apiKey/:ipAddress/*
	 * @description Enterprise API To Check IP Address
	 * @example https://api.jsecoin.com/enterprise/ipcheck/:apiKey/:ipAddress/
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/ipcheck/:apiKey/:ipAddress/*', (req, res) => {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const ipAddress = JSE.jseFunctions.cleanString(req.params.ipAddress);
		JSE.jseDataIO.getCredentialsByAPIKey(apiKey,function(goodCredentials) {
			JSE.jseDataIO.getVariable(`ledger/${goodCredentials.uid}`, function(accountBalance) {
				if (accountBalance < 1) { res.status(400).send('{"fail":1,"notification":"Account balance is too low to run enterprise APIs"}'); return false; }
				if (!(goodCredentials.apiLevel >= 1)) { res.status(400).send('{"fail":1,"notification":"API key does not have read access"}'); return false; }
				JSE.jseFunctions.realityCheck(ipAddress, function(goodIPTrue) {
					JSE.jseDataIO.getVariable('adxCaptchaIP/'+ipAddress+'/',function(humanCheck) {
						res.send(`{"success":1,"ipCheck":${goodIPTrue},"humanCheck":${humanCheck}}`);
						JSE.jseDataIO.plusX(`enterprisePayments/due/${goodCredentials.uid}`,-1);
					});
				});
				return false;
			});
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API IPCheck Failed: User API key credentials could not be found"}');
		});
		return false;
	});

	/**
	 * @name /enterprise/sethash/:apiKey/:hash/*
	 * @description Enterprise API To Write SHA256 Hash To Blockchain
	 * @example https://api.jsecoin.com/enterprise/sethash/:apiKey/:hash/
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/sethash/:apiKey/:hash/*', (req, res) => {
		let apiKey;
		if (typeof req.get('Authorization') !== 'undefined') {
			apiKey = JSE.jseFunctions.cleanString(req.get('Authorization'));
		} else {
			apiKey = JSE.jseFunctions.cleanString(req.params.apiKey);
		}
		const hash = JSE.jseFunctions.cleanString(req.params.hash).replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
		if (hash.length > 65 || hash.length < 63) {
			res.status(400).send('{"fail":1,"notification":"API setHash Failed: Invalid SHA256 Hex Hash String"}');
			return false;
		}
		JSE.jseDataIO.getCredentialsByAPIKey(apiKey,function(goodCredentials) {
			JSE.jseDataIO.getVariable(`ledger/${goodCredentials.uid}`, function(accountBalance) {
				if (accountBalance < 1) { res.status(400).send('{"fail":1,"notification":"Account balance is too low to run enterprise APIs"}'); return false; }
				if (!(goodCredentials.apiLevel >= 2)) { res.status(400).send('{"fail":1,"notification":"API key does not have write access"}'); return false; }
				const ts = new Date().getTime();
				const sideChainHash = {};
				sideChainHash.command = 'sideChainHash';
				sideChainHash.user1 = goodCredentials.uid;
				sideChainHash.hash = hash;
				sideChainHash.ts = ts;
				JSE.jseDataIO.pushBlockData(sideChainHash,function(blockData) {
					sideChainHash.tx = blockData.tx;
					JSE.jseDataIO.getVariable('blockID',function(latestBlockID) {
						sideChainHash.blockID = latestBlockID;
						JSE.jseDataIO.setVariable(`sideChainHash/${hash}/${sideChainHash.tx}`,sideChainHash);
						res.send(`{"success":1,"tx":"${sideChainHash.tx}","hash":"${sideChainHash.hash}","ts":"${sideChainHash.ts}","blockID":${sideChainHash.blockID}}`);
						JSE.jseDataIO.plusX(`enterprisePayments/due/${goodCredentials.uid}`,-1);
					});
				});
				return false;
			});
			return false;
		}, function() {
			res.status(401).send('{"fail":1,"notification":"API setHash Failed: User API key credentials could not be found"}');
		});
		return false;
	});

	/**
	 * @name /enterprise/gethash/:hash/*
	 * @description Enterprise API To Read Hash Data, no API key required, public access
	 * @example https://api.jsecoin.com/enterprise/gethash/:hash/
	 * @memberof module:jseRouter
	 * @param {object} req Express Request object
	 * @param {object} res Express Result object
	 */
	router.get('/gethash/:hash/*', (req, res) => {
		const hash = JSE.jseFunctions.cleanString(req.params.hash).replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
		let lastIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
		if (lastIP.indexOf(',') > -1) { lastIP = lastIP.split(',')[0]; }
		if (lastIP.indexOf(':') > -1) { lastIP = lastIP.split(':').slice(-1)[0]; }
		if (JSE.apiLimits[lastIP]) {
			JSE.apiLimits[lastIP] += 1;
		} else {
			JSE.apiLimits[lastIP] = 1;
		}
		if (JSE.apiLimits[lastIP] < 180) {
			JSE.jseDataIO.getVariable(`sideChainHash/${hash}/`,function(sideChainHashes) {
				const result = {};
				result.success = 1;
				result.data = sideChainHashes || {};
				result.firstSeen = null;
				result.lastSeen = null;
				result.hashes = 0;
				Object.keys(result.data).forEach((pushKey) => {
					const hashObj = result.data[pushKey];
					result.hashes += 1;
					if (!result.firstSeen || result.firstSeen > hashObj.ts) result.firstSeen = hashObj.ts;
					if (!result.lastSeen || result.lastSeen < hashObj.ts) result.lastSeen = hashObj.ts;
				});
				res.send(JSON.stringify(result));
			});
			return false;
		}
		res.status(401).send('{"fail":1,"notification":"API getHash Failed: Enterprise getHash API limit reached, try again in 30 mins"}');
		return false;
	});
}

module.exports = router;
