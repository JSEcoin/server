const JSE = global.JSE;
const express = require('express');
const authenticator = require('authenticator');
const request = require('request');
const maxmind = require('maxmind');

const geoDB = maxmind.openSync('./geoip/GeoIP2-Country.mmdb'); // actually in ../geoip but this is run from ../server.js

const router = express.Router();

/**
 * @function <h3>sendUserData</h3>
 * @memberof module:jseRouter
 * @description Gets the full user data and sends it back to user
 * @param {object} credentials Credentials object
 * @param {string} credentials.uid User ID
 * @param {string} newSessionVar new session variable set on initial login or can be null
 * @param {object} req Express Request object
 * @param {object} res Express Result object
 */
function sendUserData(credentials,newSessionVar,recordLogin,req,res) {
	JSE.jseDataIO.getUserData(credentials, function(userObjectRaw) {
		const userObject = userObjectRaw;
		if (typeof JSE.jseSettings.systemMessage !== 'undefined') {
			userObject.systemMessage = JSE.jseSettings.systemMessage;
		}
		userObject.appReleaseSupport = 64;
		if (newSessionVar) {
			userObject.session = newSessionVar; // set new session key on initial login
		} else if (req.body.app) {
			if (req.body.app === 'desktop' && userObject.desktopSession) {
				userObject.session = userObject.desktopSession; // set user.session to desktopSession, does not overwrite datastore value for credentials/session
			} else if (userObject.mobileSession) {
				userObject.session = userObject.mobileSession;
			}
		}
		if (req.body.jseUnique && req.body.jseUnique !== userObject.jseUnique) {
			const jseUnique = JSE.jseFunctions.cleanString(req.body.jseUnique);
			JSE.jseDataIO.setVariable('account/'+credentials.uid+'/jseUnique',jseUnique);
			userObject.jseUnique = jseUnique;
			if (JSE.jseSettings.blockedUniques && JSE.jseSettings.blockedUniques.indexOf(jseUnique) > -1) return false;
		}
		res.send(JSON.stringify(userObject)); // sends back full user object
		if (recordLogin) { // only on initial login
			JSE.jseDataIO.setVariable('account/'+credentials.uid+'/lastLogin',recordLogin);
			JSE.jseDataIO.pushVariable('logins/'+credentials.uid, recordLogin);
		}
		return false;
	});
}

/**
 * @function <h3>startLogin</h3>
 * @memberof module:jseRouter
 * @description Sets up a new session and logs last login time and last login IP address for initial logins
 * @param {object} credentials Credentials object
 * @param {object} req Express Request object
 * @param {object} res Express Result object
 */
function startLogin(credentials,req,res) {
	if (credentials.suspended && credentials.suspended !== 0) {
		res.status(400).send('{"fail":1,"notification":"Your account has been closed. This is due to exceeding the threshold for acceptable use. The machine learning algorithms have categorised the data associated with your account and it matched fraudulent patterns. We rely on machine learning for this purpose to remain impartial and remove the human factor from this decision."}');
		return false;
	}
	if (req.body.initial) {
		const newSessionCredentials = credentials;
		let previousSessionVar = credentials.session || null;
		const newSessionVar = JSE.jseFunctions.randString(32); // generate a new session key
		if (req.body.app) {
			if (req.body.app === 'desktop') {
				previousSessionVar = credentials.desktopSession || null;
				newSessionCredentials.desktopSession = newSessionVar;
				JSE.jseDataIO.setVariable('credentials/'+newSessionCredentials.uid+'/desktopSession', newSessionCredentials.desktopSession);
			} else if (req.body.app === 'web') { // alpha platform
				newSessionCredentials.session = newSessionVar;
				JSE.jseDataIO.setVariable('credentials/'+newSessionCredentials.uid+'/session', newSessionCredentials.session);
			} else {
				// could send through "mobile" or "ios" "android" etc
				previousSessionVar = credentials.mobileSession || null;
				newSessionCredentials.mobileSession = newSessionVar;
				JSE.jseDataIO.setVariable('credentials/'+newSessionCredentials.uid+'/mobileSession', newSessionCredentials.mobileSession);
			}
		} else {
			newSessionCredentials.session = newSessionVar;
			JSE.jseDataIO.setVariable('credentials/'+newSessionCredentials.uid+'/session', newSessionCredentials.session);
		}
		JSE.jseDataIO.setVariable('lookupSession/'+newSessionVar,newSessionCredentials.uid);
		const newDate = new Date().getTime();
		let lastIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
		if (lastIP.indexOf(',') > -1) { lastIP = lastIP.split(',')[0]; }
		if (lastIP.indexOf(':') > -1) { lastIP = lastIP.split(':').slice(-1)[0]; }
		if (JSE.jseSettings.blockedIPs && JSE.jseSettings.blockedIPs.indexOf(lastIP) > -1) return false;
		//JSE.jseDataIO.setVariable('account/'+credentials.uid+'/lastip', lastIP);
		const userAgent = JSE.jseFunctions.cleanString(String(req.body.userAgent)) || 'unknown';
		const geoObject = geoDB.get(lastIP);
		let geo = 'XX';
		if (geoObject && geoObject.country) {
			geo = geoObject.country.iso_code;
		}
		let lastApp = 'platform';
		if (req.body.app) {
			lastApp = JSE.jseFunctions.cleanString(String(req.body.app));
		}
		const recordLogin = {
			geo,
			ip: lastIP,
			ts: newDate,
			ua: userAgent,
			app: lastApp,
		};
		if (previousSessionVar) {
			JSE.jseDataIO.hardDeleteVariable('lookupSession/'+previousSessionVar);
		}
		sendUserData(newSessionCredentials,newSessionVar,recordLogin,req,res);
	} else {
		sendUserData(credentials,null,null,req,res);
	}
	return false;
}

/**
 * @function <h3>passRecaptcha</h3>
 * @memberof module:jseRouter
 * @description Checks Google Recaptcha is valid via a serverside api call
 * @param {object} credentials Credentials object
 * @param {object} req Express Request object
 * @param {object} res Express Result object
 */
function passRecaptcha(credentials,req,res) {
	let verificationUrl;
	const secretKey = JSE.credentials.recaptchaSecretKey;
	if (req.body['g-recaptcha-response']) {
		verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'];
	} else {
		let lastIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
		if (lastIP.indexOf(',') > -1) { lastIP = lastIP.split(',')[0]; }
		if (lastIP.indexOf(':') > -1) { lastIP = lastIP.split(':').slice(-1)[0]; }
		verificationUrl = "https://api.jsecoin.com/captcha/check/"+lastIP+"/";
		if (JSE.jseTestNet) verificationUrl = "http://localhost:81/captcha/check/"+lastIP+"/";
	}
	request(verificationUrl,function(errorRecaptcha,responseRecaptcha,bodyCaptchaRaw) {
		try {
			const bodyCaptcha = JSON.parse(bodyCaptchaRaw);
			if (bodyCaptcha.success && bodyCaptcha.success === true) {
				startLogin(credentials,req,res);
			} else if (bodyCaptcha.pass && bodyCaptcha.pass === true) {
				startLogin(credentials,req,res);
			} else {
				res.status(400).send('{"fail":1,"notification":"Captcha Error login.js 149, Please Try Again In 60 Seconds"}');
			}
		} catch (ex) {
			res.status(400).send('{"fail":1,"notification":"Captcha Error login.js 152, Please Try Again In 60 Seconds"}');
		}
	});
}

/**
 * @name /login/*
 * @description Login end point used for email/pass and user refresh on sessions
 * @memberof module:jseRouter
 */
router.post('/*', function (req, res) {
	if (!req.body.email && !req.body.session) { res.status(400).send('{"fail":1,"notification":"No email or session provided"}'); return false; }

	let clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (clientIP.indexOf(',') > -1) { clientIP = clientIP.split(',')[0]; }
	if (clientIP.indexOf(':') > -1) { clientIP = clientIP.split(':').slice(-1)[0]; }
	if (!JSE.loginLimits[clientIP]) {
		JSE.loginLimits[clientIP] = 1;
	} else {
		JSE.loginLimits[clientIP] += 1;
	}
	const badIPs = ['78.157.4.63','223.217.62.236','41.159.24.18','104.225.176.143','114.101.97.1','77.35.233.215','115.151.145.167','36.72.8.197','114.37.136.25','116.58.254.33','117.252.71.250','117.252.71.90','115.207.62.38','118.173.115.248','117.69.177.86','119.42.118.93','119.42.121.59','119.42.72.28','121.226.17.66','121.226.76.55','121.230.154.233','119.5.174.79','124.122.186.24','121.230.208.35','125.160.174.30','125.87.98.22','125.87.98.0','121.230.171.155','149.129.124.41','14.207.61.81','170.150.102.177','177.135.9.118','177.133.127.59','118.173.199.119','177.223.226.214','178.93.25.144','178.93.8.50','178.94.22.178','179.181.201.199','179.189.253.124','179.186.144.68','179.95.195.177','179.83.49.18','177.43.13.166','179.187.157.214','180.180.144.233','179.186.110.216','180.247.137.26','119.42.67.41','185.251.8.66','177.125.160.182','182.232.41.168','187.73.237.74','185.220.101.22','188.234.208.118','191.33.123.57','180.183.6.204','202.44.209.238','203.150.114.50','84.2.106.222','218.2.0.100','182.53.137.15','223.204.64.77','197.89.73.64','142.197.45.5','223.247.164.227','183.88.134.170','18.191.144.246','31.192.128.99','223.247.211.67','114.106.79.121','188.6.128.101','61.186.66.48','94.175.38.253','183.166.18.124','177.125.166.92','178.48.68.53','117.70.40.251','115.207.61.44','177.42.118.112','179.108.105.89','180.241.239.128','125.87.98.109','179.181.161.161','180.248.135.75','189.115.130.179','178.93.28.124','178.93.26.242','184.82.78.239','187.58.93.194','183.141.54.56','191.6.134.6','187.59.70.51','109.184.167.44','78.43.82.255','78.248.172.136','41.60.233.97','183.150.48.111','220.198.112.67'];
	if (badIPs.indexOf(clientIP) > -1) {
		res.status(400).send('{"fail":1,"notification":"Too many requests captcha.js 173"}');
		return false;
	}
	if (req.headers['accept-language'] && req.headers['accept-language'] === 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7') {
		res.status(400).send('{"fail":1,"notification":"Too many requests captcha.js 174"}');
		badIPs.push(clientIP);
		return false;
	}
	if (JSE.anonymousIPs[clientIP] && JSE.loginLimits[clientIP] > 1) {
		res.status(400).send('{"fail":1,"notification":"Too many requests captcha.js 178"}');
		//console.log(`BadIP: ${clientIP}`);
		badIPs.push(clientIP);
		badIPs.shift();
		return false;
	}
	if (JSE.loginLimits[clientIP] > 8) { // 4 per 120 seconds
		res.status(400).send('{"fail":1,"notification":"Too many requests captcha.js 179"}');
		//console.log(`BadIP: ${clientIP}`);
		//console.log(JSON.stringify(req.headers));
		badIPs.push(clientIP);
		badIPs.shift();
		return false;
	}
	if (req.body.session) {
		// Log in with session variable
		const session = JSE.jseFunctions.cleanString(String(req.body.session));
		JSE.jseDataIO.getCredentialsBySession(session,function(credentials){
			startLogin(credentials,req,res);
		},function() {
			res.status(401).send('{"fail":1,"notification":"No match for session variable in the database, please try entering your details again"}'); return false;
		});
	} else {
		// Log in with email variable
		const email = JSE.jseFunctions.cleanString(String(req.body.email)).toLowerCase();
		const password = JSE.jseFunctions.limitString(String(req.body.password));
		const passwordHashed = JSE.jseFunctions.sha256(password);
		/*
		if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
			res.status(400).send('{"fail":1,"notification":"Recaptcha Error login.js 88, Please Try Again"}');
		*/
		JSE.jseDataIO.getCredentialsByPassword(email,passwordHashed,function(credentials){
			if (credentials.twoFactorAuth && !req.body.authCode) {
				res.send('{"msg2fa":"Please enter your two factor authentication code"}');
				return false;
			} else if (credentials.twoFactorAuth && req.body.authCode) {
				if (authenticator.verifyToken(credentials.authKey, JSE.jseFunctions.cleanString(req.body.authCode))) {
					console.log('New 2fa login from '+credentials.email);
					passRecaptcha(credentials,req,res);
				} else {
					res.status(400).send('{"fail":1,"notification":"Failed to pass 2fa authentication, please try again","resetForm":1}');
				}
			} else {
				console.log(`New login from ${credentials.email} @ ${clientIP}`);
				passRecaptcha(credentials,req,res);
			}
			return false;
		},function() {
			JSE.loginLimits[clientIP] += 1;
			res.status(401).send('{"fail":1,"notification":"Login failed. Invalid email or password"}'); return false;
		});
	}
	return false;
});

module.exports = router;
