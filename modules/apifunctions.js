/**
 * @module jseAPI
 * @description API functionallity to be used within the app and via the external api routes
 *	<h5>Exported</h5>
 *		<ul>
 *		<li>apiBalance</li>
 *		<li>apiExport</li>
 *		<li>apiHistory</li>
 *		<li>apiMining</li>
 *		<li>apiTransfer</li>
 *		</ul>
 *	Full documentation at <a href="https://developer.jsecoin.com">https://developer.jsecoin.com</a>
 */

const JSE = global.JSE;
const jseCommands = require("./commands.js");

/**
 * @method <h2>apiTransfer</h2>
 * @description Used internally and via the API to transfer funds via the api with server-side ECDSA signing
 * @param {object} goodCredentials credentials object of the users sending funds
 * @param {object} toUser user object of the users receiving funds
 * @param {number} toAmount value of transfer in JSE
 * @param {string} toReference reference which is recorded privately in the platform
 * @param {boolean} privateTransfer if true email is hidden from history to prevent data leaks
 * @param {function} callback callback function called on success and failure
 */
function apiTransfer(goodCredentials,toUser,toAmount,toReference,privateTransfer,callback) {
	const dataToSign = {};
	dataToSign.publicKey = goodCredentials.publicKey;
	dataToSign.toPublicKey = toUser.publicKey;
	dataToSign.command = 'transfer';
	if (privateTransfer) { // hide email from history, stops data leak if user sends payment to publicKey
		dataToSign.private = true;
	}
	dataToSign.value = toAmount;
	const transactionReference = toReference.substr(0, 255);
	JSE.jseDataIO.setupNewTransaction(transactionReference, function(tid) {
		dataToSign.tid = tid;
		dataToSign.user1 = goodCredentials.uid;
		dataToSign.user2 = toUser.uid;
		dataToSign.ts = new Date().getTime();
		const dataString = JSON.stringify(dataToSign);
		JSE.jseFunctions.signData(dataString, goodCredentials, function(signed) {
			if (typeof signed.fail === 'undefined') {
				jseCommands.dataPush(signed,function(jsonResult){
					callback(jsonResult);
				});
			} else {
				callback(signed);
			}
		});
	});
}

/**
 * @method <h2>apiExport</h2>
 * @description Export coincodes via the API
 * @param {object} goodCredentials credentials object of the user
 * @param {number} exportAmount value of exported coincode in JSE
 * @param {function} callback callback function called on success and failure
 */
function apiExport(goodCredentials,exportAmount,callback) {
	const dataToSign = {};
	dataToSign.publicKey = goodCredentials.publicKey;
	dataToSign.command = 'export';
	dataToSign.value = exportAmount;
	dataToSign.user1 = goodCredentials.uid;
	dataToSign.ts = new Date().getTime();
	const dataString = JSON.stringify(dataToSign);
	JSE.jseFunctions.signData(dataString, goodCredentials,function(signed) {
		if (typeof signed.fail === 'undefined') {
			jseCommands.dataPush(signed,function(jsonResult){
				callback(jsonResult);
			});
		} else {
			callback(signed);
		}
	});
}

/**
 * @method <h2>apiBalance</h2>
 * @description Return the user balance or the balance of a siteID/subID lookup query
 * @param {object} credentialsCheck contains uid and apiLevel
 * @param {string} lookup can be a string or 0/false if no lookup required
 * @param {function} callback callback function called on success
 */
function apiBalance(credentialCheck,lookup,callback) {
	if (lookup === 0 || lookup === false || lookup === '0') {
		JSE.jseDataIO.getVariable('ledger/'+credentialCheck.uid,function(balance) {
			callback('{"success":1,"notification":"Your balance is '+balance+' JSE","balance":'+balance+'}');
		});
	} else {
		let balance = 0;
		const safeKey = JSE.jseDataIO.genSafeKey(lookup);
		JSE.jseDataIO.getVariable('siteIDs/'+credentialCheck.uid+'/'+safeKey+'/c',function(siteIDBalance) {
			if (siteIDBalance !== null) {
				balance += siteIDBalance;
			}
			JSE.jseDataIO.getVariable('subIDs/'+credentialCheck.uid+'/'+safeKey+'/c',function(subIDBalance) {
				if (subIDBalance !== null) {
					balance += subIDBalance;
				}
				callback('{"success":1,"notification":"Your balance is '+balance+' JSE","balance":'+balance+'}');
			});
		});
	}
}

/**
 * @method <h2>apiHistory</h2>
 * @description Return the users account history
 * @param {object} credentialsCheck contains uid and apiLevel
 * @param {function} callback callback function called on success
 */
function apiHistory(credentialCheck,callback) {
	JSE.jseDataIO.getVariable('history/'+credentialCheck.uid,function(history) {
		const returnObject = {};
		returnObject.success = 1;
		returnObject.history = history;
		callback(JSON.stringify(returnObject));
	});
}

/**
 * @method <h2>apiMining</h2>
 * @description Return the users mining history
 * @param {object} credentialsCheck contains uid and apiLevel
 * @param {function} callback callback function called on success
 */
function apiMining(credentialCheck,callback) {
	JSE.jseDataIO.getVariable('mining/'+credentialCheck.uid,function(mining) {
		const returnObject = {};
		returnObject.success = 1;
		returnObject.mining = mining;
		callback(JSON.stringify(returnObject));
	});
}

module.exports = {
	apiTransfer, apiExport, apiBalance, apiHistory, apiMining,
};
