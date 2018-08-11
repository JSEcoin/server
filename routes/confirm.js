const JSE = global.JSE;
const express = require('express');

const router = express.Router();

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
			res.send('<html><script>alert("Thanks for confirming your account"); window.location = "https://platform.jsecoin.com/";</script></html>');
			const uniqueConfirmationCode = JSE.jseFunctions.randString(12);
			JSE.jseDataIO.setVariable('account/'+credentials.uid+'/confirmed', uniqueConfirmationCode);
			setTimeout(function(checkUID,checkConfirmationCode) {
				JSE.jseDataIO.getVariable('account/'+checkUID,function(account) {
					if (account.confirmed === checkConfirmationCode && account.source === 'referral') {
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
								JSE.jseFunctions.referral(account.campaign,account.content,referralPayout);
							} else {
								console.log('Declined Referral Duplicate Account: '+account.confirmed);
								JSE.jseFunctions.referral(account.campaign,'Declined Duplicate Account Details',0.01); // Anything with Declined in will get value set to 0.01
							}
						} else {
							JSE.jseFunctions.referral(account.campaign,'Declined Region '+account.geo,1); // declined regions go through at 1 JSE
							console.log('Declined Referral GEO: '+account.geo);
						}
					} else {
						console.log('Declined Referral Source: '+account.source+' Confirmed: '+account.confirmed);
					}
					setTimeout(function() { JSE.jseDataIO.setVariable('account/'+checkUID+'/confirmed', true); }, 1000); // set timeout, shouldn't be needed but trying to fix referrals bug where a lot are getting declined because they are already confirmed
				});
			}, Math.floor(Math.random() * 60000), credentials.uid, uniqueConfirmationCode); // do this after a random interval up to 60 seconds
		} else {
			res.send('<html>Error: Confirmation code not recognised</html>');
		}
		return false;
	});
});

module.exports = router;
