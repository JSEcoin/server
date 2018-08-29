const JSE = global.JSE;
const express = require('express');
const jseAPI = require("./../modules/apifunctions.js");
const helper = require('sendgrid').mail;
const sg = require('sendgrid')(JSE.credentials.sendgridAPIKey);
const request = require('request');

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
		const cancelledTS = new Date().getTime();
		JSE.jseDataIO.getVariable('merchantSales/'+reference,function(merchantSale) {
			if (merchantSale.purchaseReference === null) {
				res.status(400).send('{"fail":1,"notification":"Cancellation Failed: purchaseReference not found"}');
				return false;
			}
			if (merchantSale.buyerUID !== goodCredentials.uid && merchantSale.sellerUID !== goodCredentials.uid) {
				res.status(400).send('{"fail":1,"notification":"Cancellation Failed: User not associated with subscription, must be buyer or seller"}');
				return false;
			}
			// code duplicated in backup.js
			JSE.jseDataIO.setVariable('merchantSales/'+reference+'/cancelledTS', cancelledTS);
			JSE.jseDataIO.setVariable('merchantPurchases/'+merchantSale.purchaseReference+'/cancelledTS', cancelledTS);
			res.send('{"success":1}');

			const cancelHTML = 'Subscription reference: '+merchantSale.reference+' has now been cancelled. Please log in to the platform for further details.';
			JSE.jseDataIO.getUserByUID(merchantSale.sellerUID, function(seller) {
				JSE.jseFunctions.sendStandardEmail(seller.email,'JSEcoin Subscription Cancellation',cancelHTML);
			}, function() {
				res.status(400).send('{"fail":1,"notification":"Processing Failed Error 59"}');
				return false;
			});
			JSE.jseDataIO.getUserByUID(merchantSale.buyerUID, function(buyer) {
				JSE.jseFunctions.sendStandardEmail(buyer.email,'JSEcoin Subscription Cancellation',cancelHTML);
			}, function() {
				res.status(400).send('{"fail":1,"notification":"Processing Failed Error 65"}');
				return false;
			});
			return false;
		});
	},function() {
		res.status(401).send('{"fail":1,"notification":"Cancellation Failed: Session credentials could not be verified."}');
	});
});

/**
 * @name /checkout/*
 * @description Complete a checkout payment
 * @memberof module:jseRouter
 */
router.post('/*', function (req, res) {
	const session = JSE.jseFunctions.cleanString(req.body.session);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
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
			const merchantSale = {};
			merchantSale.buyerUID = JSE.jseFunctions.cleanString(checkout.buyer.uid);
			merchantSale.buyerEmail = goodCredentials.email;
			merchantSale.sellerUID = JSE.jseFunctions.cleanString(checkout.uid);
			merchantSale.item = JSE.jseFunctions.cleanString(checkout.item);
			if (typeof checkout.deliveryAddress !== 'undefined') {
				merchantSale.deliveryAddress = JSE.jseFunctions.cleanString(checkout.deliveryAddress.split(/(<|&lt;)br\s*\/*(>|&gt;)/gi).join(', ').split("\n").join(', ').split('\n').join(', ').split(',,').join(',')); // replace <br /> & \n & ,, before clean
			} else {
				merchantSale.deliveryAddress = 'Not Provided';
			}
			if (typeof checkout.rebillFrequency === 'undefined') {
				merchantSale.type = 'single';
				merchantSale.amount = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(checkout.singlePrice)));
			} else {
				merchantSale.type = 'recurring';
				merchantSale.amount = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(checkout.initialPrice)));
				merchantSale.recurringPrice = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(checkout.recurringPrice)));
				merchantSale.rebillFrequency = JSE.jseFunctions.cleanString(checkout.rebillFrequency);
				merchantSale.payableDate = checkout.payableDate; // date object
			}
			merchantSale.completedTS = new Date().getTime();

			JSE.jseDataIO.getCredentialsByUID(merchantSale.sellerUID, function(toUser) {
				jseAPI.apiTransfer(goodCredentials,toUser,merchantSale.amount,merchantSale.item,false,function(jsonResult) {
					const returnObj = JSON.parse(jsonResult);
					if (returnObj.success === 1) {
						JSE.jseDataIO.pushVariable('merchantSales/'+merchantSale.sellerUID, merchantSale, function(salePushRef) {
							const merchantPurchase = {};
							merchantPurchase.reference = merchantSale.sellerUID+'/'+salePushRef; // this can be used as a fireKey 'merchantSales/'+reference
							merchantPurchase.amount = merchantSale.amount;
							merchantPurchase.item = merchantSale.item;
							merchantPurchase.sellerUID = merchantSale.sellerUID;
							if (checkout.sAuth === toUser.apiKey.substring(0, 5)) {
								merchantPurchase.sellerEmail = toUser.email;
							} else {
								merchantPurchase.sellerEmail = 'unavailable';
							}
							merchantPurchase.completedTS = merchantSale.completedTS;
							merchantPurchase.type = merchantSale.type;
							if (merchantPurchase.type === 'recurring') {
								merchantPurchase.recurringPrice = merchantSale.recurringPrice;
								merchantPurchase.rebillFrequency = merchantSale.rebillFrequency;
								merchantPurchase.payableDate = merchantSale.payableDate;
							}
							returnObj.reference = merchantPurchase.reference; // send back reference to be included in completion URL
							res.send(JSON.stringify(returnObj));
							JSE.jseDataIO.pushVariable('merchantPurchases/'+merchantSale.buyerUID, merchantPurchase, function(purchasePushRef) {
								JSE.jseDataIO.setVariable('merchantSales/'+merchantSale.sellerUID+'/'+salePushRef+'/purchaseReference', merchantSale.buyerUID+'/'+purchasePushRef); // fireKey 'merchantPurchases/'+purchaseReference
								JSE.jseDataIO.setVariable('merchantSales/'+merchantSale.sellerUID+'/'+salePushRef+'/reference', merchantSale.sellerUID+'/'+salePushRef); // fireKey 'merchantSales/'+reference
								const sellerEmailHTML = 'You have received a new JSEcoin Merchant Transaction<br><br>Item: '+merchantSale.item+'<br>Amount: '+merchantSale.amount+' JSE<br>Type: '+merchantSale.type+'<br>Buyer: '+merchantSale.buyerEmail+'<br>Delivery Address: '+merchantSale.deliveryAddress+'<br><br>Thank you for using JSEcoin for your merchant payments.';
								JSE.jseFunctions.sendStandardEmail(toUser.email,'JSEcoin Merchant Transaction',sellerEmailHTML);
								const buyerEmailHTML = 'This is to confirm you have made a purchase via JSEcoin for the following.<br><br>Item: '+merchantSale.item+'<br>Amount: '+merchantSale.amount+' JSE<br>Type: '+merchantSale.type+'<br>Delivery Address: '+merchantSale.deliveryAddress+'<br><br>Thank you for using JSEcoin for your digital payments.';
								JSE.jseFunctions.sendStandardEmail(merchantSale.buyerEmail,'JSEcoin Payment Confirmation',buyerEmailHTML);
								if (typeof checkout.ipnURL !== 'undefined') {
									const ipnURL = checkout.ipnURL.split('{reference}').join(merchantSale.sellerUID+'/'+salePushRef);
									request(ipnURL, function (error, response, body) { }); // S2S Postback IPN URL
								}
							});
							// set buyer and seller to have used merchant services so both are pulled at login
							JSE.jseDataIO.setVariable('account/'+merchantSale.sellerUID+'/merchant', 1);
							JSE.jseDataIO.setVariable('account/'+merchantSale.buyerUID+'/merchant', 1);
						});
					} else {
						res.send(jsonResult);
						console.log('Merchant payment failed ref. 95 checkout.js');
					}
				});
			});
		} else {
			res.status(400).send('{"fail":1,"notification":"Payment Failed: UserID does not match sessionID."}');
		}
		return false;
	},function() {
		res.status(401).send('{"fail":1,"notification":"Payment Failed: Session credentials could not be verified."}');
	});
});

module.exports = router;
