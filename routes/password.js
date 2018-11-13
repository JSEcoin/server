const JSE = global.JSE;
const helper = require('sendgrid').mail;
const sg = require('sendgrid')(JSE.credentials.sendgridAPIKey);
const express = require('express');
const request = require('request');

const router = express.Router();

/**
 * @name /password/change/*
 * @description Change user password once reset code has been received
 * @memberof module:jseRouter
 */
router.post('/change/*', function (req, res) {
	if (!req.body.passwordReset || !req.body.newPassword) { res.status(400).send('{"fail":1,"notification":"Error 10. No reset code and/or new password provided"}'); return false; }
	let naughtyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (naughtyIP.indexOf(',') > -1) { naughtyIP = naughtyIP.split(',')[0]; }
	let naughtyIPCount = 0;
	for (let i = 0; i < JSE.alreadySentReset.length; i+=1) {
		if (JSE.alreadySentReset[i] === naughtyIP) naughtyIPCount+=1;
	}
	if (naughtyIPCount <= 3) {
		JSE.alreadySentReset.push(naughtyIP);
		const passwordReset = JSE.jseFunctions.cleanString(String(req.body.passwordReset));
		JSE.jseDataIO.getVariable('passwordResetCodes/'+passwordReset,function(resetUID) {
			if (resetUID === null) { res.status(400).send('{"fail":1,"notification":"Error 15. Password change failed. Reset code not recognized"}'); return false; }
			if (!(parseInt(resetUID,10) === resetUID)) { res.status(400).send('{"fail":1,"notification":"Error 21. Password change failed. Reset code has expired"}'); return false; }
			JSE.jseDataIO.getCredentialsByUID(resetUID,function(credentials) {
				const password = JSE.jseFunctions.limitString(String(req.body.newPassword));
				const passwordHashed = JSE.jseFunctions.sha256(password);
				JSE.jseDataIO.setVariable('credentials/'+credentials.uid+'/passwordHashed',passwordHashed);
				const passwordChangeEmail = '<img src="https://jsecoin.com/img/logosmall.png" style="float: right;" alt="JSEcoin" /><br>Your password has been changed successfully. If you did not request this please <a href="https://jsecoin.com/contact/">Contact Us</a><br><br>Your login email is: '+credentials.email+'<br><br>Your login password has been hashed and deleted from the server.<br><br>Please make a note of your new login details and then delete this email.<br><br>Kind regards,<br><br>The JSE Team<br><hr style="border-top: 1px solid #000000;"><div style="margin-bottom: 10px;"><a href="https://jsecoin.com/"><img src="https://jsecoin.com/img/logosmall.png" alt="JSEcoin" /></a><div style="margin:10px; float: right;"><a href="https://www.facebook.com/officialjsecoin"><img src="https://jsecoin.com/img/facebookemail.png" alt="Facebook" /></a></div><div style="margin:10px; float: right;"><a href="https://twitter.com/jsecoin"><img src="https://jsecoin.com/img/twitteremail.png" alt="Twitter" /></a></div></div>';
				const fromEmail = new helper.Email('noreply@jsecoin.com');
				const toEmail = new helper.Email(credentials.email);
				const subject = 'JSEcoin Password Changed';
				const content = new helper.Content('text/html', passwordChangeEmail);
				const mail = new helper.Mail(fromEmail, subject, toEmail, content);
				const sendgridRequest = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
				sg.API(sendgridRequest, function (error, response) {
					if (error) { console.log('Sendgrid Error response received, password change '+credentials.email); }
				});
				JSE.jseDataIO.hardDeleteVariable('passwordResetCodes/'+passwordReset);
				res.send('{"success":1,"notification":"Password has been changed, please log in with your new password"}');
				return false;
			},function(){
				res.status(401).send('{"fail":1,"notification":"Error 36. Password change failed. Please contact admin@jsecoin.com"}');
			});
			return false;
		});
	}
	return false;
});

/**
 * @name /password/reset/*
 * @description Send user a password reset code
 * @memberof module:jseRouter
 */
router.post('/reset/*', function (req, res) {
	if (!req.body.email) { res.status(400).send('{"fail":1,"notification":"Error 47. No email address provided"}'); return false; }
	let naughtyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip;
	if (naughtyIP.indexOf(',') > -1) { naughtyIP = naughtyIP.split(',')[0]; }
	let naughtyIPCount = 0;
	for (let i = 0; i < JSE.alreadySentReset.length; i+=1) {
		if (JSE.alreadySentReset[i] === naughtyIP) naughtyIPCount+=1;
	}
	if (naughtyIPCount <= 2) {
		JSE.alreadySentReset.push(naughtyIP);
		// Recaptcha
		if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
			const failed = {};
			failed.fail = 1;
			failed.notification = 'Password Reset Failed: Recaptcha Error 69, Please Try Again';
			res.status(400).send(JSON.stringify(failed));
			return false;
		}
		const secretKey = JSE.credentials.recaptchaSecretKey;
		const verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'];
		request(verificationUrl,function(err,resp,bodyRaw) {
			const body = JSON.parse(bodyRaw);
			if (body.success && body.success === true) {
				const email = JSE.jseFunctions.cleanString(String(req.body.email)).toLowerCase(); // no need to cleanString because it's only used for string comparison
				JSE.jseDataIO.getUserByEmail(email,function(user) { // credentials are NOT secure as only found using email
					if (user !== null && user.uid > 0) {
						if (JSE.alreadySentReset.indexOf(user.email) === -1) { // check for email and ip address for repeat requests
							JSE.alreadySentReset.push(user.email);
							console.log('Password Reset Request '+user.email+' : '+naughtyIP);
							const credentials = {};
							credentials.uid = user.uid;
							credentials.email = user.email;
							const passwordReset = JSE.jseFunctions.randString(32);
							JSE.jseDataIO.setVariable('passwordResetCodes/'+passwordReset,credentials.uid);
							setTimeout(function() { JSE.jseDataIO.hardDeleteVariable('passwordResetCodes/'+passwordReset); }, 3600000);
							const passwordResetEmail = '<img src="https://jsecoin.com/img/logosmall.png" style="float: right;" alt="JSEcoin" /><br>We have received a request to reset your password. If you did not request this please <a href="https://jsecoin.com/contact/">Contact Us</a><br><br>Your login email is: '+credentials.email+'<br><br>Your security code to reset the password is: '+passwordReset+'<br><br>Please enter the security code and a new password into the form on the password reset page, then delete this email.<br><br>Your security code will expire in 60 minutes<br><br>Kind regards,<br><br>The JSE Team<br><hr style="border-top: 1px solid #000000;"><div style="margin-bottom: 10px;"><a href="https://jsecoin.com/"><img src="https://jsecoin.com/img/logosmall.png" alt="JSEcoin" /></a><div style="margin:10px; float: right;"><a href="https://www.facebook.com/officialjsecoin"><img src="https://jsecoin.com/img/facebookemail.png" alt="Facebook" /></a></div><div style="margin:10px; float: right;"><a href="https://twitter.com/jsecoin"><img src="https://jsecoin.com/img/twitteremail.png" alt="Twitter" /></a></div></div>';
							const fromEmail = new helper.Email('noreply@jsecoin.com');
							const toEmail = new helper.Email(credentials.email);
							const subject = 'JSEcoin Password Reset';
							const content = new helper.Content('text/html', passwordResetEmail);
							const mail = new helper.Mail(fromEmail, subject, toEmail, content);
							const sendgridRequest = sg.emptyRequest({ method: 'POST',path: '/v3/mail/send',body: mail.toJSON() });
							sg.API(sendgridRequest, function (error, response) {
								if (error) { console.log('Sendgrid Error response received, password reset '+credentials.email); }
							});
							res.send('{"success":1,"notification":"Password reset email sent"}');
						} else {
							res.status(400).send('{"fail":1,"notification":"Error 73. Password reset email already sent, please check the spam folder and wait 30 minutes before requesting again"}');
						}
					} else {
						res.status(401).send('{"fail":1,"notification":"Error 76. User not found please contact admin@jsecoin.com"}');
					}
					return false;
				},function() {
					res.status(401).send('{"fail":1,"notification":"Error 79. Email address not found"}');
				});
			} else {
				const failed = {};
				failed.fail = 1;
				failed.notification = 'Recaptcha Error 118, Please Try Again';
				res.status(400).send(JSON.stringify(failed));
			}
		});
	} else {
		res.status(401).send('{"fail":1,"notification":"Error 99. IP Address blocked or email reset already sent"}');
	}
	return false;
});

module.exports = router;
