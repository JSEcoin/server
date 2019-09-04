/**
 * @module jseFunctions
 * @description General functions that are called globally and used throughout the program
 * <h5>Exported</h5>
 * <ul>
 * <li>shuffle</li>
 * <li>randString</li>
 * <li>round</li>
 * <li>cleanString</li>
 * <li>sha256</li>
 * <li>buf2hex</li>
 * <li>hex2buf</li>
 * <li>createKeyPair</li>
 * <li>signData</li>
 * <li>verifyData</li>
 * <li>signHash</li>
 * <li>verifyHash</li>
 * <li>sendWelcomeEmail</li>
 * <li>sendStandardEmail</li>
 * <li>exportNotificationEmail</li>
 * <li>withdrawalNotificationEmail</li>
 * <li>transferNotificationEmails</li>
 * <li>referral</li>
 * <li>genSafeUser</li>
 * <li>sendSMS</li>
 * <li>realityCheck</li>
 * <li>txApprove</li>
 * </ul>
*/
const JSE = global.JSE;
const request = require('request');
const crypto = require('crypto');
const eccrypto = require("eccrypto");
const sr = require('secure-random');
const helper = require('sendgrid').mail;
const sg = require('sendgrid')(JSE.credentials.sendgridAPIKey);
const jseAPI = require("./apifunctions.js");
const jseEthIntegration = require("./ethintegration.js");
const jseEmails = require("./emails.js");
const twilio = require('twilio')('ACc50f44970e985329a823ae84606b9cf5', JSE.credentials.twilioAuthToken);
const jseCommands = require("./commands.js");

/**
 * @method <h2>shuffle</h2>
 * @description Shuffles the given array
 * @param {array} arrayRaw an array
 * @returns {array} returns a shuffled array
 */
function shuffle(arrayRaw) {
	const array = arrayRaw;
	let counter = array.length;
	let temp;
	let index;
	while (counter > 0) {
			index = Math.floor(Math.random() * counter);
			counter-=1;
			temp = array[counter];
			array[counter] = array[index];
			array[index] = temp;
	}
	return array;
}

/**
 * @method <h2>randString</h2>
 * @description Generates a random alphanumeric string including caps from five alphabet sets
 * @param {number} length string length required
 * @returns {string} returns the random alphanumeric string
 */
function randString(length) {
	const chars = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
	const randStringOut = shuffle(chars).join('').slice(0,length);
	return randStringOut;
}

/**
 * @method <h2>round</h2>
 * @description Used to round JSE tokens to the nearest 8 decimals
 * @param {number} value initial value to be rounded
 * @const decimals Rounding is carried out to 8 decimal places this could potentially be changed in the future
 * @returns {number} rounded value
 */
function round(value,decimals=8) {
	return Number(parseFloat(value).toFixed(decimals));
}

/**
 * @method <h2>cleanString</h2>
 * @description User input sanitization, uses this regex /[^ .$*+?\\\-_:/,@a-zA-Z0-9\s]/
 * @param {string} stringRaw string to be cleaned
 * @returns {string} cleaned string
 */
function cleanString(stringRaw) {
	let stringClean = stringRaw;
	stringClean = String(stringClean);
	stringClean = stringClean.split(/[^ .$*+?\\\-_:/&=,{}@a-zA-Z0-9\s]/).join('');
	stringClean = stringClean.substr(0, 255);
	return stringClean;
}

/**
 * @method <h2>limitString</h2>
 * @description User input restricted to 256 chars
 * @param {string} stringRaw string to be cleaned
 * @returns {string} cleaned string
 */
function limitString(stringRaw) {
	let stringClean = stringRaw;
	stringClean = String(stringClean);
	stringClean = stringClean.substr(0, 255);
	return stringClean;
}

/**
 * @method <h2>sha256</h2>
 * @description Standard SHA256 function, returns a Sha256 hash of the provided data string
 * @param {string} data data to be hashed
 * @returns {string} returns a SHA256 hash
 */
function sha256(data) {
	return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * @method <h2>buf2hex</h2>
 * @description Converts a buffer to a hexadecimal string
 * @param {array} buffer Array Buffer
 * @returns {string} returns a hex string
 */
function buf2hex(buffer) { // buffer is an ArrayBuffer
	return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

/**
 * @method <h2>hex2buf</h2>
 * @description Converts a hexadecimal string to an array buffer
 * @param {string} hex hex string
 * @returns {array} returns an array buffer
 */
function hex2buf(hex) {
	const array = new Uint8Array(hex.length / 2);
	let k = 0;
	for (let i=0; i<hex.length; i+=2) {
		array[k] = parseInt(hex[i] + hex[i+1], 16);
		k+=1;
	}
	const buffer = Buffer.from(array.buffer);
	return buffer;
}

/**
 * @method <h2>createKeyPair</h2>
 * @description Creates a new private and public key
 * @returns {object} returns an object including object.privateKey and object.publicKey
 */
function createKeyPair() {
	const privateKey = sr.randomBuffer(32);
	const privateKeyString = buf2hex(privateKey);
	const publicKey = eccrypto.getPublic(privateKey);
	const publicKeyString = buf2hex(publicKey);
	const keyPair = {};
	keyPair.privateKey = privateKeyString;
	keyPair.publicKey = publicKeyString;
	return keyPair;
}

/**
 * @method <h2>signData</h2>
 * @description Signs a data string using ECDSA
 * @param {string} stringData A data string to be signed
 * @param {object} keyPair A object containing object.privateKey and object.publicKey
 * @param {function} callback callsback an object with object.data, object.hash, object.publicKey, object.signature
 */
function signData(stringData, keyPair, callback) {
	if (typeof keyPair.privateKey === 'undefined' || typeof stringData === 'undefined') {
		console.log('jseFunctions.signData missing data error 100');
		callback('{"fail":1,"notification":"Missing private key or sttring data to jseFunctions.signData"}');
		return false;
	}
	const shaBuffer = crypto.createHash("sha256").update(stringData).digest();
	const privateKey = hex2buf(keyPair.privateKey);
	eccrypto.sign(privateKey, shaBuffer).then(function(signatureArrayBuffer) {
		const signatureString = buf2hex(signatureArrayBuffer);
		const signed = {};
		signed.data = stringData; // string
		signed.hash = buf2hex(shaBuffer); // hex
		signed.publicKey = keyPair.publicKey; // hex
		signed.signature = signatureString; // hex
		callback(signed);
	});
	return false;
}

/**
 * @method <h2>verifyData</h2>
 * @description Signs a data string using ECDSA
 * @param {object} signed A signed data object, including signed.data, signed.publicKey, signed.signature
 * @param {function} callback callsback with the signed object if valid
 * @param {function} failCallback callsback with the signed object if not valid
 */
function verifyData(signed, successCallback, failCallback) {
	const shaBuffer = crypto.createHash("sha256").update(signed.data).digest();
	const publicKey = hex2buf(signed.publicKey);
	const signature = hex2buf(signed.signature);
	eccrypto.verify(publicKey, shaBuffer, signature).then(function() {
		successCallback(signed);
	}).catch(function(err) {
		console.log('Unable to Verify Data. jseFunctions.verifyData() Error: 94. '+err);
		failCallback(signed);
	});
}

/**
 * @method <h2>signHash</h2>
 * @description More basic function just for signing, will probably work with any hex string
 * @param {string} hash A hash of the data
 * @param {string} privateKeyHex private key to sign data with
 * @param {function} callback callback with the signature string
 */
function signHash(hash, privateKeyHex ,callback) {
	const shaBuffer = hex2buf(hash);
	const privateKey = hex2buf(privateKeyHex);
	eccrypto.sign(privateKey, shaBuffer).then(function(signatureArrayBuffer) {
		const signatureString = buf2hex(signatureArrayBuffer);
		callback(signatureString);
	});
}

/**
 * @method <h2>verifyHash</h2>
 * @description Verify a signed hash using public key and signature
 * @param {string} hash A signed data object, including signed.data, signed.publicKey, signed.signature
 * @param {string} publicKeyHex public key that signed the data
 * @param {string} signatureHex signature attached to the signed hash
 * @param {function} successCallback blank callback if valid
 * @param {function} failCallback blank callback if not valid
 */
function verifyHash(hash, publicKeyHex, signatureHex, successCallback, failCallback) {
	const shaBuffer = hex2buf(hash);
	const publicKey = hex2buf(publicKeyHex);
	const signature = hex2buf(signatureHex);
	eccrypto.verify(publicKey, shaBuffer, signature).then(function() {
		successCallback();
	}).catch(function(err) {
		console.log('Unable to Verify Data. jseFunctions.verifyHash() Error: 140. '+err);
		failCallback();
	});
}

/**
 * @method <h2>sendWelcomeEmail</h2>
 * @description Send out a welcome email to new users including confirmation link
 * @param {object} newUser A user object
 */
function sendWelcomeEmail(newUser) {
	const fromEmail = new helper.Email('noreply@jsecoin.com');
	//if (jseEmails.suppression.indexOf(newUser.email) > -1) return;
	const toEmail = new helper.Email(newUser.email);
	const subject = 'Please confirm your JSEcoin account';
	const templates = ['template1','template2']; // split test templates
	const template = templates[Math.floor(Math.random()*templates.length)];
	const htmlContent = jseEmails.welcome.split('$uid').join(newUser.uid).split('$confirmlink').join('https://platform.jsecoin.com/?confirm=1&uid='+newUser.uid+'&confirmcode='+newUser.confirmCode);
	const emailHTML = jseEmails[template].split('$heading').join(subject).split('$content').join(htmlContent);
	const content = new helper.Content('text/html', emailHTML);
	const mail = new helper.Mail(fromEmail, subject, toEmail, content);
	mail.categories = ["nodeserver","welcomeemail",template];
	const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
	sg.API(requestSG, function (error, response) {
		if (error) { console.log('Sendgrid Error response received, welcome email '+newUser.email); }
	});
}

/**
 * @method <h2>sendOnboardingEmail</h2>
 * @description Send a autoresponder email with optional PDF using sendgrid API
 * @param {string} user user object from account/123
 * @param {string} emailRef autoresponder reference to send from emails.js
 * @param {string} callback callback used to loop through emails from modules/schedule.js
 */
function sendOnboardingEmail(user,emailRef,callback) {
	if (jseEmails.onboarding[emailRef]) { // Check we haven't sent them all already. email template doesn't exist
		const fromEmail = new helper.Email('noreply@jsecoin.com');
		if (jseEmails.suppression.indexOf(user.email) > -1) {
			callback();
			return;
		}
		const toEmail = new helper.Email(user.email);
		//console.log('Sending onboarding email to: '+user.email+' '+emailRef);
		const templates = ['template1','template2']; // split test templates
		const template = templates[Math.floor(Math.random()*templates.length)];
		const htmlContent = jseEmails.onboarding[emailRef].html;
		const subject = jseEmails.onboarding[emailRef].subject;
		const emailHTML = jseEmails[template].split('$heading').join(subject).split('$content').join(htmlContent);
		const content = new helper.Content('text/html', emailHTML);
		const mail = new helper.Mail(fromEmail, subject, toEmail, content);
		mail.categories = ["nodeserver","onboarding","onboarding"+emailRef, template];
		// check if PDF is required
		if (jseEmails.onboarding[emailRef].pdf) {
			mail.attachments = [
				{
					filename: jseEmails.onboarding[emailRef].pdf,
					content: jseEmails.onboarding[emailRef].attachmentData,
					type: 'application/pdf',
					disposition: 'attachment',
				},
			];
		}
		const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
		sg.API(requestSG, function (error, response) {
			if (error) { console.log('Sendgrid Error response received, sendOnboardingEmail emailRef '+emailRef); }
			callback();
		});
		const nowTS = new Date().getTime();
		JSE.jseDataIO.setVariable('account/'+user.uid+'/lastEmail', nowTS+','+emailRef);
	} else {
		callback();
	}
}

/**
 * @method <h2>sendStandardEmail</h2>
 * @description Send a system email using sendgrid API
 * @param {string} toEmailRaw Email address to send to
 * @param {string} subject Email subject line
 * @param {string} htmlContent Email content in HTML format
 */
function sendStandardEmail(toEmailRaw,subject,htmlContent) {
	const fromEmail = new helper.Email('noreply@jsecoin.com');
	//if (jseEmails.suppression.indexOf(toEmailRaw) > -1) return;
	const toEmail = new helper.Email(toEmailRaw);
	const emailHTML = jseEmails.template.split('$heading').join(subject).split('$content').join(htmlContent);
	const content = new helper.Content('text/html', emailHTML);
	const mail = new helper.Mail(fromEmail, subject, toEmail, content);
	mail.categories = ["nodeserver","standardemail"];
	const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
	sg.API(requestSG, function (error, response) {
		if (error) { console.log('Sendgrid Error response received, sendStandardEmail email '+toEmailRaw); }
	});
}

/**
 * @method <h2>exportNotificationEmail</h2>
 * @description Send a notification when a user exports tokens
 * @param {number} fromUID User ID to send email to
 * @param {number} transactionValue Value of the transaction
 */
function exportNotificationEmail(fromUID,transactionValue) {
	JSE.jseDataIO.getEmail(fromUID,function(emailAddress) {
		JSE.jseDataIO.getVariable('account/'+fromUID+'/noEmailTransaction', function(noEmailTransaction) {
			if (noEmailTransaction === null && fromUID > 0) {
				if (jseEmails.suppression.indexOf(emailAddress) > -1) return;
				const toEmail = new helper.Email(emailAddress);
				const fromEmail = new helper.Email('noreply@jsecoin.com');
				const subject = 'JSEcoin Export Confirmation';
				const htmlContent = 'This is to confirm a coincode has been exported from your account for the value of:<br><br><b>'+transactionValue+'JSE</b><br><br>Thank you for using JSEcoin. If you did not make this transaction please reset your password and setup two factor authentication as soon as possible.';
				const emailHTML = jseEmails.template.split('$heading').join(subject).split('$content').join(htmlContent);
				const content = new helper.Content('text/html', emailHTML);
				const mail = new helper.Mail(fromEmail, subject, toEmail, content);
				mail.categories = ["nodeserver","exportnotification"];
				const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
				sg.API(requestSG, function (error, response) {
					if (error) { console.log('Sendgrid Error response received, export notification email '+emailAddress); }
				});
			}
		});
	});
}

/**
 * @method <h2>withdrawalNotificationEmail</h2>
 * @description Send a notification when a user withdraws tokens
 * @param {number} fromUID User ID to send email to
 * @param {number} transactionValue Value of the transaction
 */
function withdrawalNotificationEmail(fromUID,transactionValue,withdrawalAddress,txHash) {
	JSE.jseDataIO.getEmail(fromUID,function(emailAddress) {
		JSE.jseDataIO.getVariable('account/'+fromUID+'/noEmailTransaction', function(noEmailTransaction) {
			if (noEmailTransaction === null && fromUID > 0) {
				if (jseEmails.suppression.indexOf(emailAddress) > -1) return;
				const toEmail = new helper.Email(emailAddress);
				const fromEmail = new helper.Email('noreply@jsecoin.com');
				const subject = 'JSEcoin Withdrawal Confirmation';
				const htmlContent = 'This is to confirm JSE tokens have been withdrawn from your account for the value of:<br><br><b>'+transactionValue+'JSE</b><br><br>Withdrawn to address: '+withdrawalAddress+'<br><br>Transaction Details: <a href="https://etherscan.io/tx/'+txHash+'">'+txHash+'</a><br><br>If you did not make this transaction please reset your password and setup two factor authentication as soon as possible.<br><br>Thank you for using JSEcoin.';
				const emailHTML = jseEmails.template.split('$heading').join(subject).split('$content').join(htmlContent);
				const content = new helper.Content('text/html', emailHTML);
				const mail = new helper.Mail(fromEmail, subject, toEmail, content);
				mail.categories = ["nodeserver","exportnotification"];
				const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
				sg.API(requestSG, function (error, response) {
					if (error) { console.log('Sendgrid Error response received, export notification email '+emailAddress); }
				});
			}
		});
	});
}

/**
 * @method <h2>depositNotificationEmail</h2>
 * @description Send a notification when a user withdraws tokens
 * @param {number} fromUID User ID to send email to
 * @param {number} txValue Value of the transaction
 * @param {string} txHash ETH Transaction hash used for etherscan link
 */
function depositNotificationEmail(fromUID,txValue,txHash) {
	JSE.jseDataIO.getEmail(fromUID,function(emailAddress) {
		JSE.jseDataIO.getVariable('account/'+fromUID+'/noEmailTransaction', function(noEmailTransaction) {
			if (noEmailTransaction === null && fromUID > 0) {
				if (jseEmails.suppression.indexOf(emailAddress) > -1) return;
				const toEmail = new helper.Email(emailAddress);
				const fromEmail = new helper.Email('noreply@jsecoin.com');
				const subject = 'JSEcoin Deposit Confirmation';
				const htmlContent = 'This is to confirm JSE tokens have been deposited to your account for the value of:<br><br><b>'+txValue+'JSE</b><br><br>Transaction Details: <a href="https://etherscan.io/tx/'+txHash+'">'+txHash+'</a><br><br>Thank you for using JSEcoin.';
				const emailHTML = jseEmails.template.split('$heading').join(subject).split('$content').join(htmlContent);
				const content = new helper.Content('text/html', emailHTML);
				const mail = new helper.Mail(fromEmail, subject, toEmail, content);
				mail.categories = ["nodeserver","exportnotification"];
				const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
				sg.API(requestSG, function (error, response) {
					if (error) { console.log('Sendgrid Error response received, export notification email '+emailAddress); }
				});
			}
		});
	});
}

/**
 * @method <h2>transferNotificationEmails</h2>
 * @description Send a notification email when a transfer takes place to the sender and receiver
 * @param {number} fromUID User ID who sent the transaction
 * @param {number} toUID User ID who received the transfer
 * @param {number} transactionValue Value of the transaction
 */
function transferNotificationEmails(fromUID,toUID,transactionValue) {
	JSE.jseDataIO.getEmail(fromUID,function(emailAddress) {
		JSE.jseDataIO.getVariable('account/'+fromUID+'/noEmailTransaction', function(noEmailTransaction) {
			if (noEmailTransaction === null && fromUID > 0) {
				if (jseEmails.suppression.indexOf(emailAddress) > -1) return;
				const toEmail = new helper.Email(emailAddress);
				const fromEmail = new helper.Email('noreply@jsecoin.com');
				const subject = 'JSEcoin Transfer Confirmation';
				const htmlContent = 'This is to confirm a transfer has been made from your account for the value of:<br><br><b>'+transactionValue+'JSE</b><br><br>Thank you for using JSEcoin. If you did not make this transaction please reset your password and setup two factor authentication as soon as possible.';
				const emailHTML = jseEmails.template.split('$heading').join(subject).split('$content').join(htmlContent);
				const content = new helper.Content('text/html', emailHTML);
				const mail = new helper.Mail(fromEmail, subject, toEmail, content);
				mail.categories = ["nodeserver","transfernotification"];
				const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
				sg.API(requestSG, function (error, response) {
					if (error) { console.log('Sendgrid Error response received, transfer notification email '+emailAddress); }
				});
			}
		});
	});
	JSE.jseDataIO.getEmail(toUID,function(emailAddress2) {
		JSE.jseDataIO.getVariable('account/'+toUID+'/noEmailTransaction', function(noEmailTransaction2) {
			if (noEmailTransaction2 === null && toUID > 0) {
				if (jseEmails.suppression.indexOf(emailAddress2) > -1) return;
				const toEmail = new helper.Email(emailAddress2);
				const fromEmail = new helper.Email('noreply@jsecoin.com');
				const subject = 'JSEcoin Funds Received';
				const htmlContent = 'This is to confirm you have received a transfer to your account for the value of:<br><br><b>'+transactionValue+'JSE</b><br><br>For more details please log in to your account at <a href="https://platform.jsecoin.com">https://platform.jsecoin.com</a><br><br>Thank you for using JSEcoin.';
				const emailHTML = jseEmails.template.split('$heading').join(subject).split('$content').join(htmlContent);
				const content = new helper.Content('text/html', emailHTML);
				const mail = new helper.Mail(fromEmail, subject, toEmail, content);
				mail.categories = ["nodeserver","transfernotification"];
				const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
				sg.API(requestSG, function (error, response) {
					if (error) { console.log('Sendgrid Error response received, transfer notification email '+emailAddress2); }
				});
			}
		});
	});
}

/**
 * @method <h2>banEmail</h2>
 * @description Upset naughty users when Dave throws down the ban hammer
 * @param {number} banUID User ID to send email to
 */
function banEmail(banUID) {
	JSE.jseDataIO.getEmail(banUID,function(emailAddress) {
		const fromEmail = new helper.Email('investigations@jsecoin.com');
		//if (jseEmails.suppression.indexOf(emailAddress) > -1) return;
		const toEmail = new helper.Email(emailAddress);
		const subject = 'JSEcoin Account Closed';
		const htmlContent = 'Dear Sir/Madam,<br><br>Your account has been closed.<br><br>This is due to exceeding the threshold for acceptable use. The machine learning algorithms have categorised the data associated with your account and it matched fraudulent patterns.<br><br>We rely on machine learning for this purpose to remain impartial and remove the human factor from this decision.<br><br>Kind regards,<br><br>The JSE Team';
		const emailHTML = jseEmails.template.split('$heading').join(subject).split('$content').join(htmlContent);
		const content = new helper.Content('text/html', emailHTML);
		const mail = new helper.Mail(fromEmail, subject, toEmail, content);
		mail.categories = ["nodeserver","banemail"];
		const requestSG = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
		sg.API(requestSG, function (error, response) {
			if (error) { console.log('Sendgrid Error response received, welcome email '+emailAddress); }
		});
	});
}

/**
 * @method <h2>referral</h2>
 * @description Send out a referral payment on DOI confirmation
 * @param {string} utmCampaign utmCampaign should be "referral"
 * @param {string} utmContent utmContent should be aff12345
 */
function referral(utmCampaign,utmContent,affPayout,geo,notes) {
	let value = affPayout;
	const strippedUID = utmCampaign.split(/[^0-9]/).join('');
	if (!strippedUID) return false; // check for blank UIDs
	JSE.jseDataIO.getVariable('account/'+strippedUID,function(affiliate) {
		if (affiliate === null) { return false; } // watch out for wrong affids
		if (typeof affiliate.affQuality !== 'undefined') { // block suspended accounts
			const rand = Math.floor(Math.random() * 10); //0-9
			if (rand >= affiliate.affQuality) {
				return false;
			}
		}
		if (typeof affiliate.affPayout !== 'undefined') {
			value = affiliate.affPayout;
		}
		const referralObj = {};
		referralObj.uid = strippedUID;
		referralObj.utmContent = utmContent;
		referralObj.value = value;
		referralObj.geo = geo;
		referralObj.notes = notes;
		const rightNow = new Date();
		referralObj.ts = rightNow.getTime();
		const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
		JSE.jseDataIO.pushVariable('referrals/'+strippedUID,referralObj,function(pushRef) {});
		JSE.jseDataIO.plusX('rewards/'+strippedUID+'/'+yymmdd+'/r', value);
		/*
		jseAPI.apiTransfer(distributionCredentials,affiliate,value,reference,false,function(jsonResult) {
			console.log('Referral payment to '+strippedUID+' for '+value+' JSE');
		});
		*/
		return false;
	});
	return false;
}

/**
 * @method <h2>genSafeUser</h2>
 * @description Remove some of the security critical variables from the user object
 * @param {object} userObject User object
 * @returns {object} Cleaned user object
 */
function genSafeUser(userObject) {
	const safeUser = JSON.parse(JSON.stringify(userObject)); // copy don't link, is this necessary for an external function?
	if (safeUser.password) { delete safeUser.password; }
	if (safeUser.passwordHashed) { delete safeUser.passwordHashed; }
	if (safeUser.confirmCode) { delete safeUser.confirmCode; }
	if (safeUser.authKey) { delete safeUser.authKey; }
	return safeUser;
}

/**
 * @method <h2>sendSMS</h2>
 * @description Send an SMS text message via twilio, currently only used for system checks
 * @param {string} toPhoneNo Phone number to send sms to
 * @param {string} txtMsg Text message to send
 */
function sendSMS(toPhoneNo,txtMsg) {
	twilio.messages.create(
		{
			from: '+441633530269',
			to: toPhoneNo,
			body: txtMsg,
		},
		(err, response) => {
			if (err) console.log('Twilio ERROR'+err);
			//if (response && response.sid) console.log(response.sid);
		} // eslint-disable-line
	);
}

/**
 * @method <h2>realityCheck</h2>
 * @description Check if an IP address is residential or a known server/VPN/proxy/ToR etc.
 * @param {string} rawIP IP address
 * @param {function} callback callback function with true/false (true = goodIP, false = badIP)
 */
function realityCheck(rawIP,callback) {
	const ip = cleanString(rawIP);
	if (!JSE.vpnData) {
		console.log('VPN Data Missing');
		callback(true);
		return false;
	}
	if (ip in JSE.vpnData) {
		if (JSE.jseTestNet) console.log('Result found in JSE.vpnData: '+JSE.vpnData[ip]);
		callback(JSE.vpnData[ip]);
	} else {
		JSE.jseDataIO.getVariable('ipCheck/'+ip, function(ipCheck) {
			if (ipCheck === null) { // not found in db, lets check now
				const apiURL = 'http://v2.api.iphub.info/ip/'+ip;
				request.get({
						url: apiURL,
						json: true,
						headers: { 'X-Key': JSE.credentials.ipHub },
				}, (err, res, result) => {
					if (typeof result === 'object' && 'block' in result) {
						if (JSE.jseTestNet) console.log('Result from iphub anonIP lookup: '+result.block);
						if (result.block === 1) {
							JSE.vpnData[ip] = false; // badIP :(
							JSE.jseDataIO.setVariable('ipCheck/'+ip,false);
							callback(false);
						} else {
							JSE.vpnData[ip] = true; // goodIP :)
							JSE.jseDataIO.setVariable('ipCheck/'+ip,true);
							callback(true);
						}
					} else {
						// backup if run out of queries / regex is to check for valid IP
						if (JSE.jseTestNet) console.log('Result from iphub failed using backup');
						//if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip) && JSE.anonymousIPs[ip] === true) {
						if (JSE.anonymousIPs[ip] === true) {
							callback(false); // badIP :(
							JSE.vpnData[ip] = false; // badIP :(
							JSE.jseDataIO.setVariable('ipCheck/'+ip,false);
						} else {
							JSE.vpnData[ip] = true; // goodIP :)
							// don't set it to goodIP in database because iphub is better data
							callback(true); // goodIP :)
						}
					}
				});
			} else if (ipCheck === true) {
				callback(true); // goodIP found in ipCheck :)
			} else {
				callback(false); // badIP found in ipCheck  :(
			}
		});
	}
	return false;
}

/**
 * @method <h2>txApprove</h2>
 * @description Remove some of the security critical variables from the user object
 * @param {number} user id
 * @param {string} pushRef value for data entry
 * @param {string} approvalType can either be email for email confirmation or admin for admin approval
 * @returns {object} Cleaned user object
 */
function txApprove(uid,pushRef,approvalType) {
	JSE.jseDataIO.getVariable('txPending/'+uid+'/'+pushRef,function(txObject) {
		let processTx = false;
		if (approvalType === 'email') {
			JSE.jseDataIO.setVariable('txPending/'+uid+'/'+pushRef+'/emailApproved',true);
			if (txObject.requireAdmin === false || txObject.adminApproved === true) processTx = true;
		}
		if (approvalType === 'admin') {
			JSE.jseDataIO.setVariable('txPending/'+uid+'/'+pushRef+'/adminApproved',true);
			if (txObject.requireEmail === false || txObject.emailApproved === true) processTx = true;
		}
		if (processTx) {
			const processedTimestamp = new Date().getTime();
			if (txObject.command === 'txlimit') {
				JSE.jseDataIO.setVariable('credentials/'+txObject.uid+'/txLimit',txObject.newTxLimit);
				// do we want to send an email here?
				JSE.jseDataIO.setVariable('txPending/'+uid+'/'+pushRef+'/complete', processedTimestamp);
			} else if (txObject.command === 'withdraw') {
				JSE.jseDataIO.getVariable('credentials/'+txObject.uid,function(goodCredentials) {
					// process withdrawal
					const dataToSign = {};
					dataToSign.publicKey = goodCredentials.publicKey;
					dataToSign.command = 'withdraw';
					dataToSign.withdrawalAddress = txObject.withdrawalAddress;
					dataToSign.withdrawalAmount = txObject.withdrawalAmount;
					dataToSign.ethFee = txObject.ethFee || JSE.jseSettings.ethFee || 118;
					dataToSign.value = JSE.jseFunctions.round(dataToSign.withdrawalAmount + dataToSign.ethFee);
					dataToSign.user1 = goodCredentials.uid;
					dataToSign.ts = processedTimestamp;
					const dataString = JSON.stringify(dataToSign);
					JSE.jseFunctions.signData(dataString, goodCredentials, function(signed) {
						if (typeof signed.fail === 'undefined') {
							jseCommands.dataPush(signed,function(jsonResult){
								if (jsonResult.indexOf('success') > -1) {
									console.log('Withdrawal Success '+goodCredentials.uid+'/'+txObject.value+'JSE/'+txObject.withdrawalAddress);
									JSE.jseDataIO.setVariable('txPending/'+uid+'/'+pushRef+'/complete', processedTimestamp);
								} else {
									console.log('Withdrawal Failed '+goodCredentials.uid+'/'+txObject.value+'JSE/'+txObject.withdrawalAddress);
									console.log(jsonResult);
									JSE.jseDataIO.setVariable('txPending/'+goodCredentials.uid+'/'+pushRef+'/adminApproved',false);
									JSE.jseDataIO.setVariable('txPending/'+goodCredentials.uid+'/'+pushRef+'/adminDeclined',true);
									JSE.jseDataIO.setVariable('txPending/'+goodCredentials.uid+'/'+pushRef+'/complete',processedTimestamp);
								}
							});
						} else {
							console.log('Withdrawal Failed2 '+goodCredentials.uid+'/'+txObject.value+'JSE/'+txObject.withdrawalAddress);
							JSE.jseDataIO.setVariable('txPending/'+goodCredentials.uid+'/'+pushRef+'/adminApproved',false);
							JSE.jseDataIO.setVariable('txPending/'+goodCredentials.uid+'/'+pushRef+'/adminDeclined',true);
							JSE.jseDataIO.setVariable('txPending/'+goodCredentials.uid+'/'+pushRef+'/complete',processedTimestamp);
						}
					});
				});
			}
		}
	});
}

module.exports = {
 shuffle, randString, round, cleanString, limitString, sha256, buf2hex, hex2buf, createKeyPair, signData, verifyData, signHash, verifyHash, sendWelcomeEmail, sendOnboardingEmail, sendStandardEmail, exportNotificationEmail, withdrawalNotificationEmail, depositNotificationEmail, transferNotificationEmails, banEmail, referral, genSafeUser, sendSMS, realityCheck, txApprove,
};
