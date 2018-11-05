const JSE = global.JSE;
const express = require('express');

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
				returnMsg = 'Thank you for confirming the transaction. Manual checks are required which can take up to 24 hours';
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
 * @description Confirm the account via double opt-in link sent in welcome email
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
						const tier1 = 'US,DE,NL,SG,HK,CH,SE,IE,NO,';
						const tier2 = 'FR,CA,GB,JP,KR,AU,CZ,IT,ES,LT,FI,AT,BE,NZ,IL,DK,SK,SI,TW,PT,';
						const tier3 = 'CN,RU,UA,PL,BR,BG,RO,TH,MY,HU,ZA,TR,GR,AR,LV,IN,VN,MX,';
						let referralPayout = 0;
						if (tier1.indexOf(account.geo) > -1) referralPayout = 500;
						if (tier2.indexOf(account.geo) > -1) referralPayout = 200;
						if (tier3.indexOf(account.geo) > -1) referralPayout = 100;
						if (referralPayout > 0) {
						//if (account.geo === 'US' || account.geo === 'CA' || account.geo === 'GB' || account.geo === 'IE' || account.geo === 'AU' || account.geo === 'NZ' || account.geo === 'ZA' || account.geo === 'DE' || account.geo === 'FR' || account.geo === 'CH' || account.geo === 'SE' || account.geo === 'NO' || account.geo === 'FI' || account.geo === 'BE' || account.geo === 'NL' || account.geo === 'LU' || account.geo === 'DK' || account.geo === 'AT') {
							if (account.duplicate === null || typeof account.duplicate === 'undefined') {
								JSE.jseFunctions.referral(checkIP,account.campaign,account.content,referralPayout,account.geo,'Confirmed');
							} else {
								console.log('Declined Referral Dupe: '+account.campaign);
								JSE.jseFunctions.referral(checkIP,account.campaign,account.content,0,account.geo,'Declined Duplicate Account'); // Anything with Declined in will get value set to 0
							}
						} else {
							JSE.jseFunctions.referral(checkIP,account.campaign,account.content,1,account.geo,'Declined Region'); // declined regions go through at 1 JSE
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

module.exports = router;
