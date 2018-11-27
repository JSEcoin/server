const JSE = global.JSE;
const helper = require('sendgrid').mail;
const sg = require('sendgrid')(JSE.credentials.sendgridAPIKey);
const ascii = require('./../modules/ascii.js');
const express = require('express');
const request = require('request');

const multer  = require('multer');

const upload = multer({ storage: multer.memoryStorage({}) });

const router = express.Router();

/**
 * @name /*
 * @description Node Home Page
 * @memberof module:jseRouter
 * @todo Could tidy this up and give it an enterprise quality facelift
 */
router.get('/', function (req, res) {
	res.send(`<style>a:link, a:visited, a:hover, a:active { color:#41FF00; }</style>
		<div style="margin: 0px; width: 100%; height: 100%; background: #111111; color: #41FF00; font-family: monospace, sans-serif; text-align: center;">
		<br><br><pre>${ascii}</pre><br>
		<a href="https://JSEcoin.com" target="_blank">https://JSEcoin.com</a><br><br>
		${JSE.jseVersion}<br><br>
		<br><a href="https://blockchain.jsecoin.com" target="_blank">Blockchain Explorer</a><br>
		<a href="https://blockchain.jsecoin.com/stats/#/Stats" target="_blank">Stats</a><br>
		<a href="/stats/" target="_blank">JSON</a><br>
		<a href="https://api.jsecoin.com/api/" target="_blank">API</a>
		<br><a href="/peerlist/" target="_blank">Peer List</a><br>
		<a href="https://platform.jsecoin.com" target="_blank">Platform Login</a>
		<div id="tw" style="margin-top: 25px; font-weight: bold;"></div>
		<script>
		var t = 'THE FUTURE OF BLOCKCHAIN, ECOMMERCE AND DIGITAL ADVERTISING';
		var i = 0;
		function typeWriter() {
		  i++;
		  if (i <= t.length) {
		    document.getElementById("tw").innerHTML = t.substring(0,i)+' <span id="blink">|</span>';
		    setTimeout(typeWriter, 50);
		  }
	    if (i % 2 == 0) {
	      document.getElementById("blink").style.color = '#111111';
	    } else {
	      document.getElementById("blink").style.color = '#41FF00';
	    }
	    if (i > t.length) { setTimeout(typeWriter, 500); }
		}
		typeWriter();
		</script>
		</div>

		`);
});

/**
 * @name /stats/*
 * @description Display JSON string of JSE.publicStats
 * @memberof module:jseRouter
 */
router.get('/stats/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send(JSON.stringify(JSE.publicStats));
});

/**
 * @name /platformsupply/*
 * @description Display the current total of the JSE ledger from JSE.publicStats
 * @memberof module:jseRouter
 */
router.get('/platformsupply/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send(String(JSE.publicStats.platformCoins));
});

/**
 * @name /circulatingsupply/*
 * @description Display the current circulating supply from JSE.publicStats
 * @memberof module:jseRouter
 */
router.get('/circulatingsupply/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send(String(JSE.publicStats.coins));
});

/**
 * @name /exchangerates/*
 * @description Display JSON string of JSE.publicStats.exchangeRates
 * @memberof module:jseRouter
 */
router.get('/exchangerates/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send(JSON.stringify(JSE.publicStats.exchangeRates));
});

/**
 * @name /dailystats/*
 * @description Display JSON string of JSE.dailyPublicStats
 * @memberof module:jseRouter
 */
router.get('/dailystats/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send(JSON.stringify(JSE.dailyPublicStats));
});

/**
 * @name /request/*
 * @description Provides JSE.currentBlockString
 * @memberof module:jseRouter
 */
router.post('/request/*', function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send(JSE.currentBlockString);
});

/**
 * @name /peerlist/*
 * @description Provides JSE.peerList
 * @memberof module:jseRouter
 */
router.get('/peerlist/*', function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send(JSON.stringify(JSE.peerList));
});

/**
 * @name /optout/*
 * @description Network wide optout via the privacy page
 * @memberof module:jseRouter
 */
router.get('/optout/*', function(req, res) {
	JSE.jseDataIO.plusOne('publicStats/totalOptOuts');
	res.header("Access-Control-Allow-Origin", "*");
	res.send('<html><script>localStorage.setItem("optout", 1); document.cookie = "optout=1;domain=.jsecoin.com;path=/;expires=Thu, 18 Dec 2037 12:00:00 UTC;"; alert("You have now opted out of cryptocurrency mining across the entire JSEcoin network");window.location="https://jsecoin.com";</script></html>');
});

/**
 * @name /optin/*
 * @description Opt in to mining network
 * @memberof module:jseRouter
 */
router.get('/optin/:optInAuthKey/*', function(req, res) {
	JSE.jseDataIO.plusOne('publicStats/totalOptIns');
	const optInAuthKey = JSE.jseFunctions.cleanString(req.params.optInAuthKey);
	res.header("Access-Control-Allow-Origin", "*");
	res.send('<html><script>localStorage.setItem("optin", "'+optInAuthKey+'"); document.cookie = "optin='+optInAuthKey+';domain=.jsecoin.com;path=/;expires=Thu, 18 Dec 2037 12:00:00 UTC;"; localStorage.removeItem("optout"); document.cookie = "optout=;domain=.jsecoin.com;path=/;expires=Thu, 01 Jan 1971 00:00:01 UTC;";</script></html>');
});

// backup optin route
router.get('/optin/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send('<html><script>localStorage.setItem("optin", 1); document.cookie = "optin=1;domain=.jsecoin.com;path=/;expires=Thu, 18 Dec 2037 12:00:00 UTC;"; localStorage.removeItem("optout"); document.cookie = "optout=;domain=.jsecoin.com;path=/;expires=Thu, 01 Jan 1971 00:00:01 UTC"; alert("You have now opted in to cryptocurrency mining across the entire JSEcoin network");window.location="https://jsecoin.com";</script></html>');
});

/**
 * @name /optclear/*
 * @description Clear opt in preference to reset and test notification etc
 * @memberof module:jseRouter
 */
router.get('/optclear/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send('<html><script>localStorage.removeItem("optout"); localStorage.removeItem("optin"); document.cookie = "optout=;domain=.jsecoin.com;path=/;expires=Thu, 01 Jan 1971 00:00:01 UTC;"; document.cookie = "optin=;domain=.jsecoin.com;path=/;expires=Thu, 01 Jan 1971 00:00:01 UTC;"; alert("You have now cleared all client optin data");</script></html>');
});

/**
 * @name /resendwelcome/*
 * @description Resend the welcome email, limited to onece per 30 minutes
 * @memberof module:jseRouter
 */
router.get('/resendwelcome/:uid/:email/', function(req, res) {
	const cleanUID = parseFloat(req.params.uid);
	const email = JSE.jseFunctions.cleanString(req.params.email).toLowerCase();
	JSE.jseDataIO.getEmail(cleanUID,function(goodEmail) {
		if (email === goodEmail) {
			let naughtyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
			if (naughtyIP.indexOf(',') > -1) { naughtyIP = naughtyIP.split(',')[0]; }
			if (naughtyIP.indexOf(':') > -1) { naughtyIP = naughtyIP.split(':').slice(-1)[0]; }
			if (JSE.alreadySentWelcomes.indexOf(email) === -1 && JSE.alreadySentWelcomes.indexOf(naughtyIP) === -1) { // check for email and ip address for repeat requests
				JSE.alreadySentWelcomes.push(email);
				JSE.alreadySentWelcomes.push(naughtyIP);
				const tmpUser = {};
				tmpUser.uid = cleanUID;
				tmpUser.email = email;
				JSE.jseDataIO.getVariable('credentials/'+cleanUID+'/confirmCode', function(confirmCode) {
					tmpUser.confirmCode = confirmCode;
					JSE.jseFunctions.sendWelcomeEmail(tmpUser);
				});
				res.send('<html><div style="width: 100%; margin-top:10px; text-align:center;"><img src="https://jsecoin.com/img/logo.png" alt="JSEcoin" /><br><br><br>Email has been resent<br><br><small>Please check the junk folder in case it has been marked by your mail provider as spam</small></div></html>');
			} else {
					console.log('Resend welcome email blocked from '+naughtyIP);
					res.status(400).send('Welcome email already sent. Please check the spam folder and wait 30 minutes before resending. (Error routes/index.js 49)');
			}
		} else {
			res.status(400).send('User ID or Email not recognized (Error routes/index.js 44.)');
		}
	});
});

/**
 * @name /myexports/*
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
 * @name /removecoincode/*
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

/**
 * @name /updateapilevel/*
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
 * @name /getapikey/*
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
 * @name /resetapikey/*
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
 * @name /updatedetails/*
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

function formatEmail(bodyObjectRaw) {
	const bodyObject = JSON.parse(JSON.stringify(bodyObjectRaw)); // clean object
	let returnString = '';
	Object.keys(bodyObject).forEach(function(key) {
		returnString += String(key).split('\n').join("\n").split('\r').join("\r").split('\t').join('')+': '+String(bodyObject[key]).split('\n').join("\n").split('\t').join('')+"\n\n";
	});
	return String(returnString);
}

function grabReplyEmail(emailContent) {
	const emailSearch = emailContent.match(/(Email: |emailAddress: |emailAddress":")(.*)/);
	let replyEmail = 'noreply@jsecoin.com';
	if (emailSearch && emailSearch[2]) {
		replyEmail = emailSearch[2];
		if (replyEmail.match(/\s/)) replyEmail = replyEmail.split(/\s/)[0];
		if (replyEmail.indexOf('"') > -1) replyEmail = replyEmail.split('"')[0];
	}
	if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(replyEmail)) replyEmail = 'noreply@jsecoin.com';
	return replyEmail;
}

/**
 * @name /adminemail/*
 * @description Send an email to the administrator
 * @memberof module:jseRouter
 */
router.post('/adminemail/*', function (req, res) {
	// Send confirmation email
	let naughtyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (naughtyIP.indexOf(',') > -1) { naughtyIP = naughtyIP.split(',')[0]; }
	if (naughtyIP.indexOf(':') > -1) { naughtyIP = naughtyIP.split(':').slice(-1)[0]; }
	if (JSE.alreadySentGeneral.indexOf(naughtyIP) === -1) { // check for email and ip address for repeat requests
		JSE.alreadySentGeneral.push(naughtyIP);
		const fromEmail = new helper.Email('noreply@jsecoin.com');
		const toEmail = new helper.Email(JSE.jseSettings.adminEmail);
		const subject = 'JSE System Email';
		const emailContent = formatEmail(req.body);
		const content = new helper.Content('text/plain', emailContent);
		const mail = new helper.Mail(fromEmail, subject, toEmail, content);
		const replyEmail = grabReplyEmail(emailContent);
		console.log('Contact email sent from: '+replyEmail);
		const replyToHeader = new helper.Email(replyEmail);
		mail.setReplyTo(replyToHeader);
		const emailRequest = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
		sg.API(emailRequest, function (error, response) {
		  if (error) { console.log('Sendgrid Error response received, admin email '+JSON.stringify(response)); }
		});
		res.send('{"success":1,"notification":"Email sent"}');
	} else {
		console.log('Admin email blocked from '+naughtyIP);
		res.status(400).send('{"fail":1,"notification":"Error 153. Limited to sending one email per 30 minutes to prevent DoS abuse."}');
	}
});

/**
 * @name /attachmentemail/*
 * @description Send an attachment email with zip file to the administrator
 * @memberof module:jseRouter
 */
router.post('/attachmentemail/*', upload.single('file'), function (req, res) {
	// https://stackoverflow.com/questions/38065118/how-to-attach-files-to-email-using-sendgrid-and-multer
	let naughtyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (naughtyIP.indexOf(',') > -1) { naughtyIP = naughtyIP.split(',')[0]; }
	if (naughtyIP.indexOf(':') > -1) { naughtyIP = naughtyIP.split(':').slice(-1)[0]; }
	if (JSE.alreadySentGeneral.indexOf(naughtyIP) === -1) { // check for email and ip address for repeat requests
		JSE.alreadySentGeneral.push(naughtyIP);
		const fromEmail = new helper.Email('noreply@jsecoin.com');
		const toEmail = new helper.Email('team@jsecoin.com');
		const subject = 'JSE Attachment Email';
		const emailContent = formatEmail(req.body);
		const content = new helper.Content('text/plain', emailContent);
		const replyEmail = grabReplyEmail(emailContent);
		console.log('Attachment email sent from: '+replyEmail);
		const replyToHeader = new helper.Email(replyEmail);
		const attachment = new helper.Attachment();
		const fileInfo = req.file;
	  attachment.setFilename(fileInfo.originalname);
	  attachment.setType(fileInfo.mimetype);
	  attachment.setContent(fileInfo.buffer.toString('base64'));
	  attachment.setDisposition('attachment');
		const mail = new helper.Mail(fromEmail, subject, toEmail, content);
		mail.setReplyTo(replyToHeader);
		mail.addAttachment(attachment);
		const emailRequest = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
		sg.API(emailRequest, function (error, response) {
		  if (error) { console.log('Sendgrid Error response received: '+JSON.stringify(response)); }
		});
		res.send('{"success":1,"notification":"Email sent"}');
	} else {
		console.log('Attachment email blocked from '+naughtyIP);
		res.status(400).send('{"fail":1,"notification":"Error 186. Limited to sending one email per 30 minutes to prevent DoS abuse."}');
	}
});

/**
 * @name /pubstats/*
 * @description Get Public Stats
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
 * @name /referrals/*
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
 * @name /logout/*
 * @description Log out of the platform or app by overwriting the session key
 * @memberof module:jseRouter
 */
router.post('/logout/*', function (req, res) {
  if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"No session provided"}'); return false; }
  const session = JSE.jseFunctions.cleanString(req.body.session);
  JSE.jseDataIO.getCredentialsBySession(session,function(credentials) {
  	const newCredentials = credentials;
		let previousSessionVar = credentials.session || null;
		newCredentials.session = JSE.jseFunctions.randString(32); // issue new session const on log out, to prevent anything happening afterwards
		if (req.body.app) {
			if (req.body.app === 'desktop') {
				JSE.jseDataIO.setVariable('credentials/'+newCredentials.uid+'/desktopSession', newCredentials.session);
				previousSessionVar = credentials.desktopSession || null;
			} else if (req.body.app === 'web') { // alpha platform
				JSE.jseDataIO.setVariable('credentials/'+newCredentials.uid+'/session', newCredentials.session);
			} else {
				JSE.jseDataIO.setVariable('credentials/'+newCredentials.uid+'/mobileSession', newCredentials.session);
				previousSessionVar = credentials.mobileSession || null;
			}
		} else {
			JSE.jseDataIO.setVariable('credentials/'+newCredentials.uid+'/session', newCredentials.session);
		}
    JSE.jseDataIO.setVariable('lookupSession/'+newCredentials.session,newCredentials.uid);
    if (previousSessionVar) {
      JSE.jseDataIO.hardDeleteVariable('lookupSession/'+previousSessionVar);
    }
    res.send('1');
  },function() {
  	res.send('1');
  });
  return false;
});

/**
 * @name /setpin/*
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
 * @name /togglemail/*
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
 * @name /appid/*
 * @description Used to provide a application id to deter command line miners
 * @memberof module:jseRouter
 */
router.get('/appid/:clientid/*', function(req, res) {
	if (JSE.jseFunctions.cleanString(req.params.clientid) === JSE.credentials.clientID) {
		// could add additional checks on the request headers here or hash a seed+datestring to change daily if problem persists.
		res.send(JSE.credentials.appID);
	} else {
		res.status(401).send('{"fail":1,"notification":"Error index.js 618. Client ID not recognized"}');
	}
});

/**
 * @name /updatetxlimit/*
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
 * @name /txtoday/*
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
 * @name /lastlogins/*
 * @description Get Public Stats
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

module.exports = router;
