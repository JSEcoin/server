/**
 * @module jseMerchant
 * @description Functions for the merchant tools
 * <h5>Exported</h5>
 * <ul>
 * <li>cancel</li>
 * <li>checkMerchantHash</li>
 * <li>processPayment</li>
 * <li>getNewAddress</li>
 * </ul>
 */

const JSE = global.JSE;

const jseAPI = require("./../modules/apifunctions.js");
const request = require("request");
const crypto = require('crypto');

const btcAddresses = require("./../misc/btc-addresses.json");
const ethAddresses = require("./../misc/eth-addresses.json");

const jseMerchant = {
	/**
	 * @method <h2>cancel</h2>
	 * @description Cancel a transaction
	 * @returns {object} sucess/fail
	 */
	cancel: async(goodCredentials,reference) => {
		const cancelledTS = new Date().getTime();
		const merchantSale = await JSE.jseDataIO.asyncGetVar('merchantSales/'+reference);
		if (merchantSale.purchaseReference === null) {
			return { fail: 1,notification: "Cancellation Failed: purchaseReference not found" };
		}
		if (parseInt(merchantSale.buyerUID,10) !== goodCredentials.uid && parseInt(merchantSale.sellerUID,10) !== goodCredentials.uid) {
			return { fail: 1,notification: "Cancellation Failed: User not associated with subscription, must be buyer or seller" };
		}
		JSE.jseDataIO.setVariable('merchantSales/'+reference+'/cancelledTS', cancelledTS);
		JSE.jseDataIO.setVariable('merchantPurchases/'+merchantSale.purchaseReference+'/cancelledTS', cancelledTS);
		const cancelHTML = 'Subscription reference: '+merchantSale.reference+' has now been cancelled. Please log in to the platform for further details.';
		const sellerEmail = await JSE.jseDataIO.asyncGetVar(`account/${merchantSale.sellerUID}/email`);
		JSE.jseFunctions.sendStandardEmail(sellerEmail,'JSEcoin Subscription Cancellation',cancelHTML);
		const buyerEmail = await JSE.jseDataIO.asyncGetVar(`account/${merchantSale.buyerUID}/email`);
		JSE.jseFunctions.sendStandardEmail(buyerEmail,'JSEcoin Subscription Cancellation',cancelHTML);
		return { success: 1 };
	},

	checkMerchantHash: async (toUserCredentials, encodedURL, hashURL) => {
		return new Promise(resolve => {
			JSE.jseDataIO.getUserData(toUserCredentials, function(toUserData) {
				const safeHashString = encodedURL+toUserData.email+toUserData.apiKey.substring(0, 10)+toUserData.regip+toUserData.registrationDate; // 10 digits public/private api sub-key mixed in with some user data to prevent brute force attack
				const sha256hash = crypto.createHash('sha256').update(safeHashString).digest("hex");
				if (sha256hash === hashURL) {
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});
	},

	/**
	 * @method <h2>processPayment</h2>
	 * @description Process and send funds from goodCredentials to checkout.uid
	 * @returns {object} sucess/fail
	 */
	processPayment: async(goodCredentials,checkout) => {
		const merchantSale = {};
		merchantSale.buyerUID = goodCredentials.uid;
		merchantSale.buyerEmail = goodCredentials.email;
		merchantSale.sellerUID = parseInt(JSE.jseFunctions.cleanString(checkout.uid),10);
		merchantSale.item = JSE.jseFunctions.cleanString(checkout.item);
		if (typeof checkout.deliveryAddress !== 'undefined') {
			merchantSale.deliveryAddress = JSE.jseFunctions.cleanString(checkout.deliveryAddress.split(/(<|&lt;)br\s*\/*(>|&gt;)/gi).join(', ').split("\n").join(', ').split('\n').join(', ').split(',,').join(',')); // replace <br /> & \n & ,, before clean
		} else {
			merchantSale.deliveryAddress = 'Not Provided';
		}
		if (typeof checkout.rebillFrequency === 'undefined') {
			merchantSale.type = 'single';
			const thePrice = checkout.calculatedPrice || checkout.singlePrice;
			merchantSale.amount = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(thePrice)));
		} else if (goodCredentials.uid === 0) { // don't allow recurring btc/eth payments
			return { fail: 1, notification: "Payment Failed: Recurring payments not allowed for btc/eth payments." };
		} else {
			merchantSale.type = 'recurring';
			if (checkout.currency) {
				merchantSale.amount = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(checkout.calculatedPrice)));
				merchantSale.recurringPrice = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(checkout.recurringPrice)));
				merchantSale.recurringCurrency = JSE.jseFunctions.cleanString(checkout.currency);
			} else {
				merchantSale.amount = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(checkout.initialPrice)));
				merchantSale.recurringPrice = JSE.jseFunctions.round(parseFloat(JSE.jseFunctions.cleanString(checkout.recurringPrice)));
			}
			merchantSale.rebillFrequency = JSE.jseFunctions.cleanString(checkout.rebillFrequency);
			merchantSale.payableDate = checkout.payableDate; // date object
		}
		if (checkout.c1) merchantSale.c1 = JSE.jseFunctions.cleanString(checkout.c1);
		if (checkout.c2) merchantSale.c2 = JSE.jseFunctions.cleanString(checkout.c2);
		if (checkout.c3) merchantSale.c3 = JSE.jseFunctions.cleanString(checkout.c3);
		merchantSale.completedTS = new Date().getTime();
		return new Promise(resolve => {
			JSE.jseDataIO.getCredentialsByUID(merchantSale.sellerUID, async function(toUser) {
				if (checkout.encoded && checkout.hash) {
					const hashTest = await jseMerchant.checkMerchantHash(toUser,checkout.encoded,checkout.hash);
					if (hashTest === false) {
						resolve({ fail: 1, notification: "Payment Failed: Merchant Hash Does Not Match Sales Data." });
						return false;
					}
				}
				const returnObj = await jseMerchant.completePayment(goodCredentials,toUser,merchantSale,checkout);
				resolve(returnObj);
				return false;
			});
		});
	},

	/**
	 * @method <h2>completePayment</h2>
	 * @description Make transfer and complete logging of payment
	 * @returns {object} sucess/fail
	 */
	completePayment: async (goodCredentials,toUser,merchantSale,checkout) => {
		return new Promise(resolve => {
			jseAPI.apiTransfer(goodCredentials,toUser,merchantSale.amount,merchantSale.item,false,function(jsonResult) {
				const returnObj = JSON.parse(jsonResult);
				if (returnObj.fail || returnObj.success !== 1) {
					console.log('Merchant payment failed ref. 116 merchant.js');
					resolve({ fail: 1, notification: JSON.stringify(jsonResult) });
					return false;
				}
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
						if (merchantSale.recurringCurrency) merchantPurchase.recurringCurrency = merchantSale.recurringCurrency;
						merchantPurchase.rebillFrequency = merchantSale.rebillFrequency;
						merchantPurchase.payableDate = merchantSale.payableDate;
					}
					returnObj.reference = merchantPurchase.reference; // send back reference to be included in completion URL
					JSE.jseDataIO.pushVariable('merchantPurchases/'+merchantSale.buyerUID, merchantPurchase, function(purchasePushRef) {
						JSE.jseDataIO.setVariable('merchantSales/'+merchantSale.sellerUID+'/'+salePushRef+'/purchaseReference', merchantSale.buyerUID+'/'+purchasePushRef); // fireKey 'merchantPurchases/'+purchaseReference
						JSE.jseDataIO.setVariable('merchantSales/'+merchantSale.sellerUID+'/'+salePushRef+'/reference', merchantSale.sellerUID+'/'+salePushRef); // fireKey 'merchantSales/'+reference
						const sellerEmailHTML = 'You have received a new JSEcoin Merchant Transaction<br><br>Item: '+merchantSale.item+'<br>Amount: '+merchantSale.amount+' JSE<br>Type: '+merchantSale.type+'<br>Buyer: '+merchantSale.buyerEmail+'<br>Delivery Address: '+merchantSale.deliveryAddress+'<br><br>Thank you for using JSEcoin for your merchant payments.';
						JSE.jseFunctions.sendStandardEmail(toUser.email,'JSEcoin Merchant Transaction',sellerEmailHTML);
						const buyerEmailHTML = 'This is to confirm you have made a purchase via JSEcoin for the following.<br><br>Item: '+merchantSale.item+'<br>Amount: '+merchantSale.amount+' JSE<br>Type: '+merchantSale.type+'<br>Delivery Address: '+merchantSale.deliveryAddress+'<br><br>Thank you for using JSEcoin for your digital payments.';
						JSE.jseFunctions.sendStandardEmail(merchantSale.buyerEmail,'JSEcoin Payment Confirmation',buyerEmailHTML);
						if (typeof checkout.ipnURL !== 'undefined') {
							if (checkout.ipnURL.indexOf('http') > -1) { // otherwise it's a pushref for a saved URL
								const ipnURL = checkout.ipnURL.split('{reference}').join(merchantSale.sellerUID+'/'+salePushRef).split('{item}').join(merchantSale.item).split('{price}').join(merchantSale.amount).split('{c1}').join(merchantSale.c1).split('{c2}').join(merchantSale.c2).split('{c3}').join(merchantSale.c3).split('{buyeremail}').join(merchantSale.buyerEmail);
								request(ipnURL, function (error, response, body) { }); // S2S Postback IPN URL
							} else {
								JSE.jseDataIO.getVariable(`merchantURL/${merchantSale.sellerUID}/${JSE.jseFunctions.cleanString(checkout.ipnURL)}/`,function(savedIPN) {
									if (savedIPN) {
										const ipnURL = savedIPN.split('{reference}').join(merchantSale.sellerUID+'/'+salePushRef).split('{item}').join(merchantSale.item).split('{price}').join(merchantSale.amount).split('{c1}').join(merchantSale.c1).split('{c2}').join(merchantSale.c2).split('{c3}').join(merchantSale.c3).split('{buyeremail}').join(merchantSale.buyerEmail);
										request(ipnURL, function (error, response, body) { }); // S2S Postback IPN URL
									}
								});
							}
						}
					});
					// set buyer and seller to have used merchant services so both are pulled at login
					JSE.jseDataIO.setVariable('account/'+merchantSale.sellerUID+'/merchant', 1);
					JSE.jseDataIO.setVariable('account/'+merchantSale.buyerUID+'/merchant', 1);
					resolve(returnObj); // success
				});
				return false;
			});
		});
	},

	/**
	 * @method <h2>getNewAddress</h2>
	 * @description Get new btc/eth address
	 * @returns {string} public key address
	 */
	getNewAddress: async (btcEth) => {
		const pendingPayment = JSE.jseDataIO.asyncGetVar('pendingPayment/');
		let foundUnused = false;
		let addressData = false;
		let count = 0;
		while (!foundUnused && count < 130) {
			const rand = Math.floor(Math.random() * 999) + 1;
			if (btcEth === 'btc') addressData = btcAddresses[rand];
			if (btcEth === 'eth') addressData = ethAddresses[rand];
			if (!addressData) return false;
			let testUnique = true;
			Object.keys(pendingPayment).forEach((pushKey) => { // eslint-disable-line
				count += 1;
				const addressInUse = pendingPayment[pushKey].payAddress;
				if (addressInUse === addressData.address) testUnique = false;
			});
			if (testUnique === true) foundUnused = true;
		}
		if (count > 120) { // prevent DoS run out of addresses, 1 payment per block average
			return false;
		}
		return addressData[btcEth+'Address'];
	},

};

module.exports = jseMerchant;
