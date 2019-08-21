const JSE = global.JSE;
const express = require('express');
const jseEthIntegration = require("./../modules/ethintegration.js");
const jseMerchant = require("./../modules/merchant.js");

const router = express.Router();

/**
 * @name /checkout/process/*
 * @description Process a merchantSale, sends out an update email to buyer
 * @memberof module:jseRouter
 */
router.post('/process/*', function (req, res) {
	const session = JSE.jseFunctions.cleanString(req.body.session);
	const reference = JSE.jseFunctions.cleanString(req.body.reference);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		const processedTS = new Date().getTime();
		JSE.jseDataIO.getVariable('merchantSales/'+reference,function(merchantSale) {
			if (merchantSale.purchaseReference === null) {
				res.status(400).send('{"fail":1,"notification":"Processing Failed: purchaseReference not found"}');
				return false;
			}
			JSE.jseDataIO.setVariable('merchantSales/'+reference+'/processedTS', processedTS);
			JSE.jseDataIO.setVariable('merchantPurchases/'+merchantSale.purchaseReference+'/processedTS', processedTS);
			res.send('{"success":1}');
			const pHTML = 'Your purchase reference: '+merchantSale.reference+' has now been marked as processed by the seller.';
			JSE.jseDataIO.getUserByUID(merchantSale.buyerUID, function(buyer) {
				JSE.jseFunctions.sendStandardEmail(buyer.email,'JSEcoin Order Processed',pHTML);
			}, function() {
				res.status(400).send('{"fail":1,"notification":"Processing Failed Error 27"}');
			});
			return false;
		});
	},function() {
		res.status(401).send('{"fail":1,"notification":"Processing Failed: Session credentials could not be verified."}');
	});
});

/**
 * @name /checkout/cancel/*
 * @description Cancel a incomplete checkout payment
 * @memberof module:jseRouter
 */
router.post('/cancel/*', function (req, res) {
	const session = JSE.jseFunctions.cleanString(req.body.session);
	const reference = JSE.jseFunctions.cleanString(req.body.reference);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		const result = jseMerchant.cancel(goodCredentials,reference);
		if (result.success) res.send(JSON.stringify(result));
		if (result.fail) res.status(400).send(JSON.stringify(result));
	},function() {
		res.status(401).send('{"fail":1,"notification":"Cancellation Failed: Session credentials could not be verified."}');
	});
});

/**
 * @name /checkout/setuptransaction/:btceth/*
 * @description Request a bitcoin or ethereum payment addresss and price, setup a transaction
 * @memberof module:jseRouter
 */
router.post('/setuptransaction/*', async (req, res) => {
	let lastIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (lastIP.indexOf(',') > -1) { lastIP = lastIP.split(',')[0]; }
	if (lastIP.indexOf(':') > -1) { lastIP = lastIP.split(':').slice(-1)[0]; }
	if (JSE.apiLimits[lastIP]) {
		JSE.apiLimits[lastIP] += 1;
	} else {
		JSE.apiLimits[lastIP] = 1;
	}
	if (JSE.apiLimits[lastIP] < 10) {
		const checkout = req.body;
		const btcEth = JSE.jseFunctions.cleanString(checkout.payCurrency).toLowerCase();
		checkout.payAddress = await jseMerchant.getNewAddress(btcEth);
		if (checkout.currency) {
			checkout.calculatedPrice = Math.round(checkout.singlePrice / JSE.publicStats.exchangeRates[checkout.currency.toUpperCase()+'JSE']);
			if (checkout.currency.toLowerCase() === btcEth) {
				checkout.payPrice = checkout.singlePrice;
			} else {
				checkout.payPrice = checkout.calculatedPrice * JSE.publicStats.exchangeRates[btcEth.toUpperCase()+'JSE'];
			}
		} else { // checkout.currency = undefined = JSE
			checkout.calculatedPrice = checkout.singlePrice;
			checkout.payPrice = checkout.calculatedPrice * JSE.publicStats.exchangeRates[btcEth.toUpperCase()+'JSE'];
		}
		let decimals = 8;
		if (btcEth === 'eth') decimals = 16; // avoid big number issue, 100 gwei denominations
		checkout.payPrice = JSE.jseFunctions.round(checkout.payPrice,decimals);
		if (checkout.payPrice < 0.00000001) checkout.payPrice = 0.00000001; // min transaction
		checkout.ts = new Date().getTime(); // overwrite to avoid malicious values
		checkout.received = false;
		if (checkout.payAddress && checkout.payPrice) {
			if (btcEth === 'btc') {
				checkout.payBalance = await jseEthIntegration.balanceBTC(checkout.payAddress);
			} else if (btcEth === 'eth') {
				checkout.payBalance = await jseEthIntegration.balanceETH(checkout.payAddress);
			}
			if (Number.isNaN(checkout.payBalance) || checkout.payBalance < 0) { // safety checks
				res.status(400).send('{"fail":1,"notification":"Checking Payment Address Balance Failed: Try again in 5 mins"}');
				return false;
			}
			JSE.jseDataIO.pushVariable('pendingPayment/',checkout,function(pushRef) {
				checkout.pendingRef = pushRef;
				res.send(JSON.stringify(checkout));
			});
		} else {
			res.status(400).send('{"fail":1,"notification":"Generating Payment Address Failed: New address limits reached, try again in 30 mins"}');
		}
	} else {
		res.status(401).send('{"fail":1,"notification":"Generating Payment Address Failed: API limit reached, try again in 30 mins"}');
	}
	return false;
});

/**
 * @name /checkout/checkpending/:pendingRef/*
 * @description Check if a btc/eth payment has gone through yet.
 * @memberof module:jseRouter
 */
router.get('/checkpending/:pendingRef/*', async (req, res) => {
	const pendingRef = JSE.jseFunctions.cleanString(req.params.pendingRef);
	const paymentCheck = await JSE.jseDataIO.asyncGetVar(`successPayment/${pendingRef}/`);
	if (paymentCheck && paymentCheck.received) {
		res.send(`{"success":1,"paymentReceived":"${paymentCheck.received}","reference":"${paymentCheck.reference}"}`);
	} else {
		res.send(`{"success":1,"paymentReceived":false}`);
	}
});

/**
 * @name /checkout/*
 * @description Complete a checkout payment
 * @memberof module:jseRouter
 */
router.post('/*', function (req, res) {
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session, async (goodCredentials) => {
		const pin = String(req.body.pin).split(/[^0-9]/).join('');
		let pinAttempts = 0;
		JSE.pinAttempts.forEach((el) => { if (el === goodCredentials.uid) pinAttempts +=1; });
		if (pinAttempts > 3) {
			res.status(400).send('{"fail":1,"notification":"Error 97. Account locked three incorrect attempts at pin number, please check again in six hours"}');
			return false;
		} else if (goodCredentials.pin !== pin || pin === null || typeof pin === 'undefined') {
			JSE.pinAttempts.push(goodCredentials.uid);
			res.status(400).send('{"fail":1,"notification":"Error 101. Pin number incorrect or blocked, attempt '+(pinAttempts+1)+'/3"}');
			return false;
		}
		req.body.pin = null; // wipe value
		const checkout = req.body;
		if (goodCredentials.uid === checkout.buyer.uid) {
			const result = await jseMerchant.processPayment(goodCredentials,checkout);
			if (result.success) res.send(JSON.stringify(result));
			if (result.fail) res.status(400).send(JSON.stringify(result));
		} else {
			res.status(400).send('{"fail":1,"notification":"Payment Failed: UserID does not match sessionID."}');
		}
		return false;
	},function() {
		res.status(401).send('{"fail":1,"notification":"Payment Failed: Session credentials could not be verified."}');
	});
});

module.exports = router;
