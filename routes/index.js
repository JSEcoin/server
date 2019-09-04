const JSE = global.JSE;
const helper = require('sendgrid').mail;
const sg = require('sendgrid')(JSE.credentials.sendgridAPIKey);
const ascii = require('./../modules/ascii.js');
const express = require('express');

const multer = require('multer');

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
	//res.send(String(JSE.publicStats.coins));
	res.send('443479880'); // coinmarketcap
});

/**
 * @name /totalsupply/*
 * @description Display the current total supply of ERC20 tokens - burnt tokens.
 * @memberof module:jseRouter
 */
router.get('/totalsupply/*', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.send('10000000000');
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
 * @name /missingtransaction/*
 * @description Report missing transaction
 * @memberof module:jseRouter
 */
router.post('/missingtransaction/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error 384. No Session Variable"}'); return false; }
	let naughtyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (naughtyIP.indexOf(',') > -1) { naughtyIP = naughtyIP.split(',')[0]; }
	if (naughtyIP.indexOf(':') > -1) { naughtyIP = naughtyIP.split(':').slice(-1)[0]; }
	if (JSE.alreadySentGeneral.indexOf(naughtyIP) === -1) { // check for email and ip address for repeat requests
		JSE.alreadySentGeneral.push(naughtyIP);
		const session = JSE.jseFunctions.cleanString(req.body.session);
		JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
			const fromEmail = new helper.Email('noreply@jsecoin.com');
			const toEmail = new helper.Email(JSE.jseSettings.adminEmail);
			const subject = 'JSE Missing Transaction';
			const missingAddress = JSE.jseFunctions.cleanString(req.body.address);
			const missingType = JSE.jseFunctions.cleanString(req.body.type);
			const missingAmount = JSE.jseFunctions.cleanString(req.body.amount);

			let emailContent = 'UID: '+goodCredentials.uid+"\n\n";
			if (req.body.address) emailContent += "Address: "+missingAddress+"\n\nEtherscan: https://etherscan.io/address/"+missingAddress+"#tokentxns\n\n";
			if (missingType) emailContent += 'Type: '+missingType+"\n\n";
			if (missingAmount) emailContent += 'Amount: '+missingAmount+" JSE \n\n";
			const content = new helper.Content('text/plain', emailContent);
			const mail = new helper.Mail(fromEmail, subject, toEmail, content);
			const replyEmail = goodCredentials.email;
			console.log('Contact email sent from: '+replyEmail);
			const replyToHeader = new helper.Email(replyEmail);
			mail.setReplyTo(replyToHeader);
			const emailRequest = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
			sg.API(emailRequest, function (error, response) {
				if (error) { console.log('Sendgrid Error response received, admin email '+JSON.stringify(response)); }
			});
			res.send('{"success":1,"notification":"Email sent"}');
		}, function() {
			res.status(400).send('{"fail":1,"notification":"Error 395. Session variable invalid."}');
		});
	} else {
		res.status(400).send('{"fail":1,"notification":"Error 398. Limited to sending one email per 30 minutes to prevent DoS abuse."}');
	}
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

module.exports = router;
