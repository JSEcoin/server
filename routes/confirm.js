const JSE = global.JSE;
const express = require('express');
const request = require('request');
const jseMachineLearning = require("./../modules/machinelearning.js");
const maxmind = require('maxmind');

const geoDB = maxmind.openSync('./geoip/GeoIP2-Country.mmdb'); // actually in ../geoip but this is run from ../server.js
const router = express.Router();


/**
 * @name /confirm/tx/*
 * @description Confirm the transaction via email
 * @example https://server.jsecoin.com/confirm/tx/:uid/:pushref/:confirmKey
 * @memberof module:jseRouter
 */
router.get('/tx/:uid/:pushref/:confirmkey', function(req, res) {
	let returnMsg = "Thank you for confirming the transaction";
	const cleanUID = parseFloat(req.params.uid);
	const pushRef = JSE.jseFunctions.cleanString(req.params.pushref);
	const confirmKey = JSE.jseFunctions.cleanString(req.params.confirmkey);
	JSE.jseDataIO.getVariable('txPending/'+cleanUID+'/'+pushRef,function(txObject) {
		if (txObject === null) {
			returnMsg = 'Transaction confirmation reference not recognised Error: confirm.js 19';
		} else if (txObject.complete || txObject.emailApproved === true) {
			returnMsg = 'Transaction has already been confirmed';
		} else if (txObject.confirmKey === confirmKey) {
			JSE.jseFunctions.txApprove(cleanUID,pushRef,'email');
			if (txObject.requireAdmin === true && txObject.adminApproved === false) {
				returnMsg = 'Thank you for confirming the transaction. Please note withdrawals can take anything from a few minutes up to 24 hours';
			} else {
				returnMsg = 'Thank you for confirming the transaction.';
			}
		} else {
			returnMsg = 'Something went wrong with the transaction confirmation, please contact admin@jsecoin.com - Error: confirm.js 28';
		}
		res.send('<html><script>alert("'+returnMsg+'"); window.location = "https://platform.jsecoin.com/";</script></html>');
	});
});

/**
 * @name /confirm/*
 * @description Older version can be removed in Dec 2018 Confirm the account via double opt-in link sent in welcome email
 * @example https://server.jsecoin.com/confirm/:uid/:confirmcode
 * @memberof module:jseRouter
 */
router.get('/:uid/:confirmcode', function(req, res) {
	JSE.jseDataIO.getCredentialsByUID(req.params.uid.split(/[^0-9]/).join(''),function(credentials) {
		if (credentials == null || credentials.confirmCode == null) {
			res.send('<html><script>alert("Error confirming account confirm.js"); window.location = "https://platform.jsecoin.com/";</script></html>');
			return false;
		}
		if (credentials.confirmCode === req.params.confirmcode) {
			let confirmIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
			if (confirmIP.indexOf(',') > -1) { confirmIP = confirmIP.split(',')[0]; }
			res.send('<html><script>alert("Thanks for confirming your account"); window.location = "https://platform.jsecoin.com/";</script></html>');
			const uniqueConfirmationCode = JSE.jseFunctions.randString(12);
			JSE.jseDataIO.setVariable('account/'+credentials.uid+'/uniqueConfirmationCode', uniqueConfirmationCode);
			setTimeout(function(checkUID,checkConfirmationCode,checkIP) {
				JSE.jseDataIO.getVariable('account/'+checkUID,function(account) {
					if (account.uniqueConfirmationCode === checkConfirmationCode && account.source === 'referral' && account.confirmed === false) {
						const tier1 = 'US,DE,SG,HK,CH,SE,IE,NO,FR,CA,GB,JP,KR,AU,CZ,IT,ES,LT,FI,AT,BE,NZ,IL,DK,SK,SI,PT,';
						//const tier2 = 'FR,CA,GB,JP,KR,AU,CZ,IT,ES,LT,FI,AT,BE,NZ,IL,DK,SK,SI,TW,PT,';
						let referralPayout = 0;
						if (tier1.indexOf(account.geo) > -1) referralPayout = 300;
						//if (tier2.indexOf(account.geo) > -1) referralPayout = 200;
						//if (tier3.indexOf(account.geo) > -1) referralPayout = 100;
						if (referralPayout > 0) {
							if (account.duplicate === null || typeof account.duplicate === 'undefined') {
								JSE.jseFunctions.realityCheck(checkIP, function(goodIPTrue) {
									if (goodIPTrue === false) {
										console.log('Referral declined realitycheck on IP address: '+checkIP);
										JSE.jseFunctions.referral(account.campaign,account.content,0,account.geo,'Declined Non Residential IP Address, VPN, ToR');
									} else {
										JSE.jseFunctions.referral(account.campaign,account.content,referralPayout,account.geo,'Confirmed');
									}
								});
							} else {
								console.log('Declined Referral Dupe: '+account.campaign);
								JSE.jseFunctions.referral(account.campaign,account.content,0,account.geo,'Declined Duplicate Account');
							}
						} else {
							JSE.jseFunctions.referral(account.campaign,account.content,1,account.geo,'Declined Region'); // declined regions go through at 1 JSE
							console.log('Declined Referral GEO: '+account.campaign+'/'+account.geo);
						}
					} else {
						console.log('Declined Referral '+account.source+'/'+account.campaign+'/'+account.confirmed+'/'+account.uniqueConfirmationCode+'/'+checkConfirmationCode);
					}
					setTimeout(function() { JSE.jseDataIO.setVariable('account/'+checkUID+'/confirmed', true); }, 1000); // set timeout, shouldn't be needed but trying to fix referrals bug where a lot are getting declined because they are already confirmed
					setTimeout(function() { JSE.jseDataIO.hardDeleteVariable('account/'+checkUID+'/uniqueConfirmationCode'); }, 1000); // cleanup no need for this in the data
				});
			}, (10 + Math.floor(Math.random() * 50000)), credentials.uid, uniqueConfirmationCode,confirmIP); // do this after a random interval up to 60 seconds
		} else {
			res.send('<html>Error: Confirmation code not recognised</html>');
		}
		return false;
	});
});

/**
 * @name /confirm/*
	* @description New post version with recaptcha. Confirm the account via double opt-in link sent in welcome email
 * @example https://server.jsecoin.com/confirm/:uid/:confirmcode
 * @memberof module:jseRouter
 */
router.post('/:uid/:confirmcode/*', function(req, res) {
	// Recaptcha
	if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
		const failed = {};
		failed.fail = 1;
		failed.notification = 'Registration Failed: Recaptcha Error 452, Please Try Again';
		res.status(400).send(JSON.stringify(failed));
		return;
	}
	const secretKey = JSE.credentials.recaptchaSecretKey;
	const verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'];
	const jseTrack = req.body;

	request(verificationUrl,function(error,response,bodyRaw) {
		const body = JSON.parse(bodyRaw);
		if (body.success && body.success === true) {
				JSE.jseDataIO.getCredentialsByUID(req.params.uid.split(/[^0-9]/).join(''),function(credentials) {
				if (credentials == null || credentials.confirmCode == null) {
					res.send('{"success":1,"notification":"Confirmation received"}');
					return false;
				}
				if (credentials.confirmCode === req.params.confirmcode) {
					let confirmIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
					if (confirmIP.indexOf(',') > -1) { confirmIP = confirmIP.split(',')[0]; }
					jseTrack.userIP = confirmIP;
					const geoObject = geoDB.get(confirmIP);
					if (geoObject && geoObject.country) {
						jseTrack.geo = geoObject.country.iso_code;
					} else {
						jseTrack.geo = 'XX';
					}
					res.send('{"success":1,"notification":"Confirmation received"}');
					const uniqueConfirmationCode = JSE.jseFunctions.randString(12);
					JSE.jseDataIO.setVariable('account/'+credentials.uid+'/uniqueConfirmationCode', uniqueConfirmationCode);
					setTimeout(function(checkUID,checkConfirmationCode,checkIP,jTrack) {
						JSE.jseDataIO.getVariable('account/'+checkUID,function(account) {
							if (account.uniqueConfirmationCode === checkConfirmationCode && account.source === 'referral' && account.confirmed === false) {
								const tier1 = 'US,DE,SG,HK,CH,SE,IE,NO,FR,CA,GB,JP,KR,AU,CZ,IT,ES,LT,FI,AT,BE,NZ,IL,DK,SK,SI,PT,';
								let referralPayout = 0;
								if (tier1.indexOf(account.geo) > -1) referralPayout = 300;
								if (referralPayout > 0) {
									if (account.duplicate === null || typeof account.duplicate === 'undefined') {
										JSE.jseFunctions.realityCheck(checkIP, function(goodIPTrue) {
											if (goodIPTrue === false) {
												console.log('Referral declined realitycheck on IP address: '+checkIP);
												JSE.jseFunctions.referral(account.campaign,account.content,0,account.geo,'Declined Non Residential IP Address, VPN, ToR');
											} else {
												jseMachineLearning.referralCheck(account,referralPayout,jTrack);
											}
										});
									} else {
										console.log('Declined Referral Dupe: '+account.campaign);
										JSE.jseFunctions.referral(account.campaign,account.content,0,account.geo,'Declined Duplicate Account');
									}
								} else {
									JSE.jseFunctions.referral(account.campaign,account.content,1,account.geo,'Declined Region'); // declined regions go through at 1 JSE
									console.log('Declined Referral GEO: '+account.campaign+'/'+account.geo);
								}
							} else {
								console.log('Declined Referral '+account.source+'/'+account.campaign+'/'+account.confirmed+'/'+account.uniqueConfirmationCode+'/'+checkConfirmationCode);
							}
							setTimeout(function() { JSE.jseDataIO.setVariable('account/'+checkUID+'/confirmed', true); }, 1000); // set timeout, shouldn't be needed but trying to fix referrals bug where a lot are getting declined because they are already confirmed
							setTimeout(function() { JSE.jseDataIO.hardDeleteVariable('account/'+checkUID+'/uniqueConfirmationCode'); }, 1000); // cleanup no need for this in the data
						});
					}, (10 + Math.floor(Math.random() * 50000)), credentials.uid, uniqueConfirmationCode,confirmIP,jseTrack); // do this after a random interval up to 60 seconds
				} else {
					res.status(400).send('{"fail":1,"notification":"Error: Confirmation code not recognised"}'); return false;
				}
				return false;
			});
		} else {
			const failed = {};
			failed.fail = 1;
			failed.notification = 'Recaptcha Error 168, Please Try Again';
			res.status(400).send(JSON.stringify(failed));
		}
	});
});

module.exports = router;
