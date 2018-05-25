/**
 * @name /admin/*
 * @description End points for admin tools look ups
 * @private
 * @memberof module:jseRouter
 */

const JSE = global.JSE;
const express = require('express');

const router = express.Router();

router.get('/stats/:startid/:endid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const startID = parseFloat(req.params.startid);
	const endID = parseFloat(req.params.endid);
	JSE.jseDataIO.getAdminAccounts(startID,endID,function(accounts){
		res.send(JSON.stringify(accounts));
	});
	return false;
});

router.get('/ledger/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.buildLedger(function(ledger){
		res.send(JSON.stringify(ledger));
	});
	return false;
});

router.get('/suspend/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	const now = new Date().getTime();
	if (uid > 0) { // just a little safety check
		JSE.jseDataIO.setVariable('credentials/'+uid+'/suspended',now);
		JSE.jseDataIO.setVariable('account/'+uid+'/suspended',now);
	}
	res.send('{"success":1}');
	return false;
});

router.get('/banemail/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	const now = new Date().getTime();
	JSE.jseFunctions.banEmail(uid);
	res.send('{"success":1}');
	return false;
});

router.get('/unsuspend/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	if (uid > 0) {
		JSE.jseDataIO.setVariable('credentials/'+uid+'/suspended',0);
		JSE.jseDataIO.setVariable('account/'+uid+'/suspended',0);
	}
	res.send('{"success":1}');
	return false;
});

router.get('/kyc/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.setVariable('account/'+uid+'/kyc',true);
	res.send('{"success":1}');
	return false;
});

router.get('/investor/:uid/:value/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	const value = parseFloat(req.params.value);
	JSE.jseDataIO.getVariable('investors/'+uid,function(investedSoFar) {
		const totalInvestment = investedSoFar + value;
		JSE.jseDataIO.setVariable('investors/'+uid,totalInvestment);
		JSE.jseDataIO.setVariable('account/'+uid+'/invested',totalInvestment);
		res.send('{"success":1,"totalInvestment":'+totalInvestment+'}');
	});
	return false;
});

router.get('/getaccount/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.getVariable('account/'+uid,function(returnObject) {
		res.send(JSON.stringify(returnObject));
	});
	return false;
});

router.get('/getemail/:email/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const email = req.params.email.toLowerCase();
	JSE.jseDataIO.getUserByEmail(email,function(returnObject) {
		res.send(JSON.stringify(returnObject));
	}, function() {
		res.status(400).send('{"fail":1}');
	});
	return false;
});

router.get('/getinvestors/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.getVariable('investors',function(returnObject) {
		res.send(JSON.stringify(returnObject));
	});
	return false;
});

router.get('/affpayout/:uid/:affpayout/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	const affPayout = parseFloat(req.params.affpayout);
	JSE.jseDataIO.setVariable('account/'+uid+'/affPayout',affPayout);
	res.send('{"success":1}');
	return false;
});

router.get('/affquality/:uid/:affquality/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	const affQuality = parseFloat(req.params.affquality);
	JSE.jseDataIO.setVariable('account/'+uid+'/affQuality',affQuality);
	res.send('{"success":1}');
	return false;
});

router.get('/minequality/:uid/:minequality/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	const mineQuality = parseFloat(req.params.minequality);
	JSE.jseDataIO.setVariable('account/'+uid+'/mineQuality',mineQuality);
	res.send('{"success":1}');
	return false;
});

router.get('/confirm/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.setVariable('account/'+uid+'/confirmed',true);
	res.send('{"success":1}');
	return false;
});

router.get('/delete/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const now = new Date().getTime();
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.setVariable('credentials/'+uid+'/suspended',now);
	JSE.jseDataIO.setVariable('account/'+uid+'/suspended',now);
	JSE.jseDataIO.setVariable('account/'+uid+'/email','deleted@jsecoin.com');
	console.log('Admin Deleted '+uid);
	res.send('{"success":1}');
	return false;
});

router.get('/resetpassword/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	const newPassword = JSE.jseFunctions.randString(12);
	const passwordHashed = JSE.jseFunctions.sha256(newPassword);
	JSE.jseDataIO.setVariable('credentials/'+uid+'/passwordHashed',passwordHashed);
	res.send(newPassword);
	return false;
});


router.get('/remove2fa/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.setVariable('credentials/'+uid+'/twoFactorAuth',false);
	res.send('{"success":1}');
	return false;
});

router.get('/updatenotes/:uid/:adminpass/:notes', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.setVariable('account/'+uid+'/adminNotes',req.params.notes);
	res.send('{"success":1}');
	return false;
});

router.get('/serverlog/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.getVariable('serverLog',function(serverLog) {
		res.send(serverLog);
	});
	return false;
});

router.get('/gethistory/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.getVariable('history/'+uid,function(returnObject) {
		res.send(JSON.stringify(returnObject));
	});
	return false;
});

router.get('/getsiteids/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.getVariable('siteIDs/'+uid,function(returnObject) {
		res.send(JSON.stringify(returnObject));
	});
	return false;
});

router.get('/getallsiteids/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.getVariable('siteIDs/',function(returnObject) {
		res.send(JSON.stringify(returnObject));
	});
	return false;
});

router.get('/getexports/:uid/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	JSE.jseDataIO.getMyExportedCoins(uid,function(returnObject) {
		res.send(JSON.stringify(returnObject));
	});
	return false;
});

router.get('/fraudbuster/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const fraudData = {};
	JSE.jseDataIO.getVariable('statsToday',function(statsDaily) {
		fraudData.statsDaily = statsDaily;
		if (JSE.blockID > 99) { // check the firebase listener has kicked in
			const blockRef = JSE.jseDataIO.getBlockRef(JSE.blockID);
			if (blockRef >= 0) { // double check
				JSE.jseDataIO.getVariable('blockChain/'+blockRef+'/',function(currentBlockChain) {
					fraudData.currentBlockChain = currentBlockChain;
					res.send(JSON.stringify(fraudData));
				});
			}
		} else {
			console.log('fraudBuster error routes/admin.js 163 blockID check');
		}
	});
	return false;
});


router.get('/publisherIPs/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	res.send(JSON.stringify(JSE.publisherIPs));
	return false;
});

router.get('/platformIPs/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	res.send(JSON.stringify(JSE.platformIPs));
	return false;
});

module.exports = router;
