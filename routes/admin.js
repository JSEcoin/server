/**
 * @name /admin/*
 * @description End points for admin tools look ups
 * @private
 * @memberof module:jseRouter
 */

const JSE = global.JSE;
const jseAPI = require("./../modules/apifunctions.js");

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

router.get('/txlimit/:uid/:txlimit/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.params.uid);
	const txLimit = parseFloat(req.params.txlimit);
	JSE.jseDataIO.setVariable('credentials/'+uid+'/txLimit',txLimit);
	res.send('{"success":1}');
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
	JSE.jseDataIO.setVariable('account/'+uid+'/name','Account Deleted');
	JSE.jseDataIO.setVariable('account/'+uid+'/email','deleted@jsecoin.com');
	JSE.jseDataIO.setVariable('account/'+uid+'/address','deleted');
	const deletedPassword = JSE.jseFunctions.sha256(Math.random());
	JSE.jseDataIO.setVariable('credentials/'+uid+'/passwordHashed',deletedPassword);
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
	JSE.jseDataIO.getAdminExportedCoins(uid,function(returnObject) {
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

router.get('/bounty/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.getVariable('bounty/',function(bounty) {
		res.send(JSON.stringify(bounty));
	});
	return false;
});

router.post('/bountyUpdate/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const pushRef = JSE.jseFunctions.cleanString(req.body.pushRef);
	const value = parseFloat(req.body.value);
	const bountyType = JSE.jseFunctions.cleanString(req.body.bountyType);
	const strippedUID = String(req.body.uid).split(/[^0-9]/).join('');
	if (req.body.update === 'approved') {
		JSE.jseDataIO.setVariable('bounty/'+pushRef+'/status',3);
		JSE.jseDataIO.setVariable('bounty/'+pushRef+'/value',value);
		JSE.jseDataIO.getVariable('account/'+strippedUID,function(affiliate) {
			const pHTML = `Your ${bountyType} bounty submission ref. ${pushRef} has been approved and your account has been credited.<br><br>Thank you for supporting the JSEcoin project`;
			JSE.jseFunctions.sendStandardEmail(affiliate.email,'JSEcoin Bounty Approved',pHTML);
			const reference = 'Bounty payment '+bountyType+': '+pushRef;
			JSE.jseDataIO.getCredentialsByUID(0,function(distributionCredentials) {
				jseAPI.apiTransfer(distributionCredentials,affiliate,value,reference,false,function(jsonResult) {
					res.send('{"success":1}');
				});
			});
		});
	} else if (req.body.update === 'declined') {
		JSE.jseDataIO.setVariable('bounty/'+pushRef+'/status',2);
		JSE.jseDataIO.getVariable('account/'+strippedUID,function(affiliate) {
			const reason = JSE.jseFunctions.cleanString(req.body.reason);
			const pHTML = `Your ${bountyType} bounty submission ref. ${pushRef} has been declined.<br><br>${reason}`;
			JSE.jseFunctions.sendStandardEmail(affiliate.email,'JSEcoin Bounty Declined',pHTML);
			res.send('{"success":1}');
		});
	} else if (req.body.update === 'declinedNoEmail') {
		JSE.jseDataIO.setVariable('bounty/'+pushRef+'/status',2);
		res.send('{"success":1}');
	} else if (req.body.update === 'airdropConfirmation') {
		JSE.jseDataIO.setVariable('bounty/'+pushRef+'/status',3);
		JSE.jseDataIO.getVariable('account/'+strippedUID,function(affiliate) {
			JSE.jseDataIO.setVariable('account/'+strippedUID+'/airDrop',true);
			const pHTML = `Your airdrop submission ref. ${pushRef} has been approved and your account will be credited on 2018-07-04.<br><br>Thank you for supporting the JSEcoin project`;
			JSE.jseFunctions.sendStandardEmail(affiliate.email,'JSEcoin Airdrop Approved',pHTML);
			res.send('{"success":1}');
		});
	} else if (req.body.update === 'ambassadorPayment') {
		JSE.jseDataIO.setVariable('bounty/'+pushRef+'/status',3);
		JSE.jseDataIO.setVariable('bounty/'+pushRef+'/value',value);
		JSE.jseDataIO.getVariable('account/'+strippedUID,function(affiliate) {
			const pHTML = `You have been sent a JSEcoin Ambassador reward.<br><br>Thank you for supporting the JSEcoin project`;
			JSE.jseFunctions.sendStandardEmail(affiliate.email,'JSEcoin Ambassador Reward',pHTML);
			const reference = 'Ambassador Reward: '+pushRef;
			JSE.jseDataIO.getCredentialsByUID(0,function(distributionCredentials) {
				jseAPI.apiTransfer(distributionCredentials,affiliate,value,reference,false,function(jsonResult) {
					res.send('{"success":1}');
				});
			});
		});
	}
	return false;
});

router.get('/txpending/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.getVariable('txPending/',function(txPending) {
		res.send(JSON.stringify(txPending));
	});
	return false;
});

router.get('/getrewards/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.getVariable('rewards/',function(rewards) {
		res.send(JSON.stringify(rewards));
	});
	return false;
});

router.get('/getlogins/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.getVariable('logins/',function(logins) {
		res.send(JSON.stringify(logins));
	});
	return false;
});

router.post('/txpendingupdate/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const uid = parseFloat(req.body.uid);
	const pushRef = JSE.jseFunctions.cleanString(req.body.pushRef);
	const updateType = JSE.jseFunctions.cleanString(req.body.updateType);
	if (updateType === 'approved') {
		JSE.jseFunctions.txApprove(uid,pushRef,'admin');
	} else if (updateType === 'declined') {
		JSE.jseDataIO.setVariable('txPending/'+uid+'/'+pushRef+'/adminApproved',false);
		JSE.jseDataIO.setVariable('txPending/'+uid+'/'+pushRef+'/adminDeclined',true);
		JSE.jseDataIO.setVariable('txPending/'+uid+'/'+pushRef+'/complete',true);
	}
	res.send('{"success":1}');
	return false;
});

router.get('/ipcheck/:ip/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const ip = req.params.ip.split(/[^.0-9]/).join('');
	if (ip.length > 8) {
		JSE.jseFunctions.realityCheck(ip, function(goodIPTrue) {
			if (goodIPTrue === true) {
				res.send('{"success":1,"notification":"Good IP"}');
			} else if (goodIPTrue === false) {
				res.send('{"success":1,"notification":"Bad IP"}');
			} else {
				res.send('{"success":1,"notification":"Unknown IP"}');
			}
		});
	} else {
		res.status(400).send('{"fail":1,"notification":"IP address not valid"}');
	}
	return false;
});

router.get('/ipwhitelist/:ip/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const ip = req.params.ip.split(/[^.0-9]/).join('');
	if (ip.length > 8) {
		JSE.jseDataIO.setVariable('ipCheck/'+ip,true);
		JSE.vpnData[ip] = true;
		res.send('{"success":1,"notification":"IP updated changes may take up to 24 hours for nodes to refresh data"}');
	} else {
		res.status(400).send('{"fail":1,"notification":"IP address not valid"}');
	}
	return false;
});

router.get('/ipblacklist/:ip/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	const ip = req.params.ip.split(/[^.0-9]/).join('');
	if (ip.length > 8) {
		JSE.jseDataIO.setVariable('ipCheck/'+ip,false);
		JSE.vpnData[ip] = false;
		res.send('{"success":1,"notification":"IP updated changes may take up to 24 hours for nodes to refresh data"}');
	} else {
		res.status(400).send('{"fail":1,"notification":"IP address not valid"}');
	}
	return false;
});

router.get('/adxcampaigns/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }
	JSE.jseDataIO.getVariable('adxCampaigns/', async(adxCampaigns) => {
		res.send(JSON.stringify(adxCampaigns));
	});
	return false;
});

router.get('/adxcampaignapproval/:advid/:campaignid/:filename/:status/:adminpass', function(req, res) {
	let adminPass;
	if (typeof req.get('Authorization') !== 'undefined') {
		adminPass = JSE.jseFunctions.cleanString(req.get('Authorization'));
	} else {
		adminPass = JSE.jseFunctions.cleanString(req.params.adminpass);
	}
	if (adminPass !== JSE.credentials.jseAdminKey) { return false; }

	const status = JSE.jseFunctions.cleanString(req.params.status);
	const advID = JSE.jseFunctions.cleanString(req.params.advid);
	const campaignID = JSE.jseFunctions.cleanString(req.params.campaignid);
	const fileName = JSE.jseFunctions.cleanString(req.params.filename);
	if (fileName === 'campaign') {
		// campaign approval
		if (status === 'approved') JSE.jseDataIO.setVariable(`adxCampaigns/${advID}/${campaignID}/disabled`,false);
		if (status === 'declined') JSE.jseDataIO.setVariable(`adxCampaigns/${advID}/${campaignID}/disabled`,'declined');
		res.send('{"success":1,"notification":"Campaign status updated"}');
	} else {
		// individual banner approval
		JSE.jseDataIO.getVariable(`adxCampaigns/${advID}/${campaignID}/banners`, (bannersRaw) => {
			if (!bannersRaw) {
				res.status(400).send('{"fail":1,"notification":"No banners found"}');
				return false;
			}
			const banners = bannersRaw;
			for (let i = 0; i < banners.length; i+=1) {
				if (banners[i].fileName === fileName) {
					//console.log('### '+banners[i].fileName+'/'+fileName);
					if (status === 'approved') banners[i].disabled = false;
					if (status === 'declined') banners[i].disabled = 'declined';
				}
			}
			JSE.jseDataIO.setVariable(`adxCampaigns/${advID}/${campaignID}/banners`,banners);
			res.send('{"success":1,"notification":"Banner status updated"}');
			return false;
		});
	}
	return false;
});

module.exports = router;
