const JSE = global.JSE;
const { exec } = require('child_process');
const fs = require('fs');
//const debug = require('debug')('*')
const jseSchedule = require('./../modules/schedule.js');
//const jseEthIntegration = require("./../modules/ethintegration.js");
const now = new Date().getTime();

/*
function updateNext(i) {
	JSE.jseDataIO.getVariable('account/'+i+'/registrationDate',function(regString) {
		if (typeof(regString) === 'string' && regString.indexOf('T') > -1) {
			const timestamp = new Date(regString).getTime();
			console.log(i+','+timestamp);
			JSE.jseDataIO.setVariable('account/'+i+'/registrationDate',timestamp);
		} else {
			console.log(i+','+'skipped')
		}
		if (i < 14573) { // set to last userid
			updateNext(i+1);
		} else {
			console.log('All done');
		}
	});
}
*/

async function runTxt() {
	// ### RUN ALL FUNCTIONS HERE
	//cleanRewards();
	//resetDailyStatsManually();

	//cleanUp(135000);

	//jseSchedule.pushPending();

	//importJSONFile('ledger','./../../../bkup/2018/February/180207/ledger.json');
	//importBigJSONFile('history','./../../../bkup/2018/February/180202/history180202A.json');
	//importEntireDB(); // warning this will overwrite entire database
	//buildLookupTables();

	//JSE.jseDataIO.updatePublicStats();

	/*
	const naughtyUsers = ['1','2'];
	const banReason = 'reason';
	for (var i = 0; i < naughtyUsers.length; i+=1) {
		banUser(naughtyUsers[i],banReason);
	}
	*/

	// email lookups
	const uids = [21,35,41,42,44,72,85,90,98,126,128,134,141,145,150,178,203,205,206,268,274,278,304,425,459,501,658,720,873,879,931,988,1053,1411,1763,1979,2080,2839,3053,3348,3431,3555,3976,4126,4163,4481,4554,4555,4655,4658,4853,5093,5259,5305,5356,5395,6384,6535,6660,7076,7097,7189,8342,8375,9231,9250,9883,10210,10225,10387,10610,10854,11253,11639,11780,11820,11863,12060,12063,12080,12283,12325,12971,13135,13372,13412,13732,13778,13933,13948,14307,14361,14420,14462,14569,14666,14874,14892,14952,15217,15228,15257,15392,15578,15588,15659,15812,15838,15857,16092,16143,16212,16231,16286,16349,16376,16526,16664,16752,16959,17073,17081,17130,17231,17574,17605,17658,18023,18331,18336,18442,18459,18584,18713,18759,18968,19342,19414,19458,19532,20406,20490,20710,20833,21285,21788,21899,22568,23297,23398,23482,23787,23866,24239,24688,24705,25081,25099,25444,25814,25989,26026,26161,26198,26229,26367,26760,26849,26895,27062,27207,27237,27254,27470,27621,27629,27676,27790,27798,28025,28082,28246,28248,28333,28348,28425,28431,28489,28602,29137,29157,29294,29957,30169,30195,30222,30238,30599,31052,31078,31149,31414,31426,31484,31607,31734,31784,31810,32094,32726,32875,33062,33356,33379,34279,36150,36167,36759,36879,37285,37369,39094,39278,39538,39732,40203,40420,40615,40622,40696,40844,40873,41219,41317,41501,41690,41850,42073,42863,43167,43304,44113,44246,44303,44395,45472,45567,45635,46157,46843,46898,47345,47941,48427,48611,48824,48987,49115,49757,49823,50322,50458,50701,50764,50977,51105,51108,51371,51413,51679,51730,52003,52013,52029,52171,52312,52448,53290,53421,53605,53746,53815,53832,53976,54247,54248,54331,54607,54635,55093,55446,55507,55549,55747,56001,56071,56154,56307,56552,56698,56711,56996,57168,57385,57449,57762,58495,58548,58711,58738,58911,58930,58948,59160,59343,59445,59603,59900,59981,60155,60382,60474,60825,61217,61439,61457,61816,62088,62104,62256,62307,62332,62436,62471,62518,62567,62689,62709,62781,62844,63586,63590,63593,63973,63992,63993,64069,64267,64599,64632,64716,64978,65008,65260,65962,66072,66221,66261,66339,66624,66811,66957,67208,67481,67930,68775,68777,69011,69454,69570,69681,69695,70024,70044,70121,70163,70345,70371,70458,70459,70541,70852,70908,71214,71231,71324,71495,71783,71830,71845,72011,72017,72458,73132,73154,73494,73557,74563,76851,77731,78112,78225,78271,79006,79648,79843,81073,81790,83092,83980,84500,84845,87025,88324,88847,89889,90511,90885,90934,90995,91002,91203,91208,91290,91292,91378,91422,91515,91560,91656,91760,91944,92276,92716,92784,92818,93169,93172,93679,93781,94170,94213,94649,95173,95367,95590,95842,96305,96766,96857,97364,97510,97582,97695,97829,97854,98483,98790,98881,98996,99523,99650,99723,99822,99827,101497,102293,103068,103493,103761,103958,104188,104715,105057,105179,105280,105674,106018,106359,106691,106744,106803,107185,107356,108172,108434,108441,108536,109249,109532,109722,110225,110260,111075,111220,111333,111574,112130,112173,112216,112470,112833,112847,112883,112964,113209,113748,113750,113778,114425,114530,114706,114777,114854,115245,115322,115425,115493,115696,115697,115946,116166,116267,117173,117432,117719,117723,117943,118176,118375,118553,119469,120327,121043,121092,121287,121709,122334,124925,125070,125598,126822,127107,127276,127554,127607,128838,129633,130014,130936,131054,131183,131746,132963,133183,133480,133772,134162,134167,134472,134474,134989,135252,135341,135520,135948,136139,136337,136559,137321,137365,137704,137796,137932,137985,138100,138145,138189,138375,138642,138654,138838,139114,139231,139245,139321,139522,139605,139891,140295,140307,140374,140434,140732,140815,141127,141299,141387,141419,141804,141895,141910,141911,141952,141996,142034,142091,142092,142098,142174,142252,142485,142560,142583,142610,142675,142710,142714,142758,142815,142841,142928,142943,142957,142976,143015,143086,143156,143211,143219,143225,143230,143292,143388,143392,143419,143460,143528,143537,143603,143680,143685,143686,143847,143977,144041,144083,144102,144105,144133,144188,144291,144359,144445,144453,144531,144549,144559,144654,144658,144693,144703,144751,144757,144811,144858,145338,145341,145349,145365,145380,145453,145456,145462,145464,145465,145467,145468,145482,145530,145561,145602,145638,145642,145674,145689,145739,145753,145831,145855,145895,146185,146203,146308,146342,146348,146354,146369,146403,146434,146459,146525,146619,146631,146644,146683,146702,146711,146738,146756,146775];
	uids.forEach(async (uid) => {
		const acc = await JSE.jseDataIO.asyncGetVar('account/'+uid+'/');
		if (!acc.suspended) {
			console.log(acc.email);
		}
	});

	/*
	JSE.jseDataIO.getVariable('publicStats',function(reply) {
		console.log(reply);
	});
	*/

	// const asyncTest = await JSE.jseDataIO.asyncGetVar('account/1');

	//	Repair missed UID
	/*
	JSE.jseDataIO.getVariable('account/43470',function(reply) {
		reply.uid = 72475;
		JSE.jseDataIO.setVariable('account/72475',reply);
	});
	JSE.jseDataIO.getVariable('credentials/43470',function(reply) {
		reply.uid = 72475;
		JSE.jseDataIO.setVariable('credentials/72475',reply);
	});
	*/

	// add naughty IP's to block list
	/*
	const naughtyIPs = ['1.0.199.25','50.202.100.162'];
	naughtyIPs.forEach(async (ip) => {
		console.log('Blacklisting: '+ip);
		await JSE.jseDataIO.asyncSetVar('ipCheck/'+ip,false);
	});
	*/

	// Remove siteID
	/*
	const cleanWhat = 'subIDs'; // subIDs or siteIDs
	const file = './logs/cli-'+cleanWhat+'.json';
	console.log('Starting JSON Import');
	//const badSite = 'Fromthesoleofthefootevenuntotheheadthereisnosoundnessinitbutwoundsandbruisesandputrifyingsorestheyha';
	const jsonString = fs.readFileSync(file).toString();
	const obj = JSON.parse(jsonString);
	let count = 0;
	Object.keys(obj).forEach((key) => {
		if (obj[key]) {
			Object.keys(obj[key]).forEach((key2) => {
				//if (obj[key][key2] && obj[key][key2].s && obj[key][key2].s.indexOf('.') === -1) {
				//if (obj[key][key2] && key2.indexOf(badSite) > -1) {
				//if (obj[key][key2] && key2.length > 60 && key2.length < 80 && key2.split(/(b|a|e|l)/g).length > 40) {
				if (obj[key][key2] && obj[key][key2].h === 0 && obj[key][key2].a === 0 && obj[key][key2].c === 0) {
					count += 1;
					setTimeout(function(k,k2) {
						JSE.jseDataIO.hardDeleteVariable(cleanWhat+'/'+k+'/'+k2);
						console.log(k +' '+k2);
					},(count * 100),key,key2);
				}
			});
		}
	});
	console.log('Done');
	*/

	/*
	const pubs = [1,2,3];
	function checkPub() {
		const pub = pubs.pop();
		JSE.jseDataIO.getVariable('rewards/'+pub,function(rewards) {
			//console.log('Checking: '+pub);
			if (rewards && rewards['181119'] && rewards['181119'].p && rewards['181119'].p > 50) {
				const twoDaysAgo = rewards['181119'].p;
				if (rewards['181120'] && rewards['181120'].p && rewards['181120'].p < twoDaysAgo) {
					const threshold = Math.round(twoDaysAgo / 10) || 0;
					if ((rewards['181121'] && rewards['181121'].p && rewards['181121'].p < threshold) || !rewards['181121'] || !rewards['181121'].p) {
						console.log('Caught: '+pub);
					}
				}
			}
		});
		if (pubs.length) {
			setTimeout(() => { checkPub(); },500);
		}
	}
	checkPub();
*/
	/*
			JSE.jseDataIO.getVariable('siteIDs',function(siteIDs) {
				let pubs = 0;
				//for (let i in siteIDs) {
				Object.keys(siteIDs).forEach(function(i) {
					let maxSiteCount = 0;
					//if (!siteIDs.hasOwnProperty(i)) continue;
					if (siteIDs[i]) {
						Object.keys(siteIDs[i]).forEach(function(key) {
						//for(const key in siteIDs[i]) {
							maxSiteCount +=1;
							if (maxSiteCount < 100 && siteIDs[i][key].s !== 'Platform Mining' && siteIDs[i][key].s !== 'undefined') { // no more than 100 sites per user
								pubs +=1;
							}
						});
					}
				});
				//JSE.publicStats.pubs = pubs;
				console.log(pubs);
				//JSE.jseDataIO.setVariable('publicStats/pubs',JSE.publicStats.pubs);
			});
	*/

	/*
	let i = 0;
	function cleanUp() {
		const ic = i;
		JSE.jseDataIO.getVariable('account/'+ic+'/lastIP',function(lastIP) {
			JSE.jseDataIO.getVariable('account/'+ic+'/lastip',function(lastip) {
				if (lastip === null && lastIP !== null) {
					JSE.jseDataIO.setVariable('account/'+ic+'/lastip',lastIP);
				}
				JSE.jseDataIO.hardDeleteVariable('account/'+ic+'/lastIP');
				console.log('Removed lastIP for '+ic);
				i += 1;
				if (i < 70000) cleanUp();
			});
		});
	}
	cleanUp();
	*/

	/*
	const newKeys = [];
	for (var i = 0; i < 1000; i++) {
		const keyPair = JSE.jseFunctions.createKeyPair();
		newKeys.push(keyPair);
		console.log(keyPair.privateKey + ','+keyPair.publicKey);
	}
	fs.writeFile('./logs/newKeys.json', JSON.stringify(newKeys), 'utf8', function(err) { // eslint-disable-line
		if (err) { if (JSE.jseTestNet) console.log('ERROR URGENT db.js 191: Error writing backup file'); }
	});
	*/
}

function printLogo() {
	if (typeof JSE.version === 'undefined') {
		const ascii = require('./../modules/ascii.js');
		console.log('\x1b[1m', ascii);
		console.log('\x1b[0m','');
	}
}

function help() {
	console.log('JSE interactive client');
	console.log('Commands available:');
	console.log('  get - get and variable from datastore    - get account/145/regip');
	console.log('  set - set a string variable              - set account/145/name Jim');
	console.log('  setnum - set a number variable           - setnum statsToday/145/o 1');
	console.log('  true - set a number variable             - true account/145/confirmed');
	console.log('  false - set a number variable            - false account/145/confirmed');
	console.log('  keys - print a list of object keys       - keys test/123');
	console.log('  del - delete a variable                  - del test/123/abc');
	console.log('  harddel - hard delete a variable        	- harddel test/123/abc');
	console.log('  typeof - get object/string/number type   - typeof test/123');
	console.log('  json - download data as a json file      - json account/145');
	console.log('  bkuplocal - download all data as json 	  - bkuplocal');
	console.log('  bkupremote - send backup command to db	  - bkupremote');
	console.log('  updateloader - minify and update code    - updateloader');
	console.log('  badstats - find bad data in stats    		- badstats');
	console.log('  repairstats - find bad data in stats    	- repairstats');
	console.log('  miningmaintenance - reduce miningdb			- miningmaintenance');
	console.log('  cleanup - clean up siteIDs & subIDs			- cleanup');
	console.log('  badledger - find bad data in ledger    	- badledger');
	console.log('  rewards - manually process rewrads   		- rewards 180914');
	console.log('  checkip - realityCheck on IP             - checkip 13.2.3.5');
	console.log('  sysmsg - set a new platform message      - sysmsg welcome to the jungle');
	console.log('  runtxt - run code in the runTxt function - runtxt');
	console.log('  exit - leave console                     - exit');
}

function updateLoader() {
	exec('uglifyjs ./embed/loader.js -c -o ./embed/loader.min.js', (err, stdout, stderr) => { // store together as .tar.gz
		if (err) console.log(`err: ${err}`);
		if (stdout) console.log(`stdout: ${stdout}`);
		if (stderr) console.log(`stderr: ${stderr}`);
		const loader = fs.readFileSync('./embed/loader.min.js').toString();
		JSE.jseDataIO.setVariableThen('jseSettings/loader', loader, function() {
			console.log('Loader minified and updated from server/embed/loader.min.js');
		});
	});
}

function findBadDataInLedger() {
	// look for why the stats aren't updating, possible blank user
	JSE.jseDataIO.buildLedger(function(ledger) {
		JSE.publicLedger = ledger;
		JSE.publicStats.users = 0;
		JSE.publicStats.coins = 0; // total circulation
		Object.keys(JSE.publicLedger).forEach(function(key) {
			JSE.publicStats.users+=1;
			JSE.publicStats.coins += JSE.publicLedger[key];
			//if (publicLedger[key] > 5000) { console.log(key); }
			if (Number.isNaN(JSE.publicStats.coins)) {
				console.log('uid '+JSE.publicStats.users);
				console.log('coin '+JSE.publicStats.coins);
			}
		});

		console.log('Total coins: '+JSE.publicStats.coins);
	});
}

function findBadSiteStats() {
	JSE.jseDataIO.getVariable('statsToday',function(statsToday) {
		Object.keys(statsToday).forEach(function(key) {
			if (typeof statsToday[key].h !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/h');
			if (typeof statsToday[key].u !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/u');
			if (typeof statsToday[key].c !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/c');
			if (typeof statsToday[key].a !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/a');
			if (typeof statsToday[key].o !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/o');
		});
	});
}

function repairBadSiteStats() {
	JSE.jseDataIO.getVariable('statsToday',function(statsToday) {
		Object.keys(statsToday).forEach(function(key) {
			if (typeof statsToday[key].h !== 'number') {
				console.log('Fixing: statsToday/'+key+'/h');
				JSE.jseDataIO.setVariable('statsToday/'+key+'/h',0);
			}
			if (typeof statsToday[key].u !== 'number') {
				console.log('Fixing: statsToday/'+key+'/u');
				JSE.jseDataIO.setVariable('statsToday/'+key+'/u',0);
			}
			if (typeof statsToday[key].c !== 'number') {
				console.log('Fixing: statsToday/'+key+'/c');
				JSE.jseDataIO.setVariable('statsToday/'+key+'/c',0);
			}
			if (typeof statsToday[key].a !== 'number') {
				console.log('Fixing: statsToday/'+key+'/a');
				JSE.jseDataIO.setVariable('statsToday/'+key+'/a',0);
			}
			if (typeof statsToday[key].o !== 'number') {
				console.log('Fixing: statsToday/'+key+'/o');
				JSE.jseDataIO.setVariable('statsToday/'+key+'/o',0);
			}
		});
	});
}

function cleanUpSpecificSiteData(subIDsOrSiteIDs, targetUID, finalUserID) {
	let targetWhat = 'siteIDs';
	if (subIDsOrSiteIDs === 'subIDs') targetWhat = 'subIDs';
	JSE.jseDataIO.getVariable(targetWhat+'/'+targetUID,function(subIDs) {
		if (subIDs) {
			if (Object.keys(subIDs).length > 10000) {
				console.log('Too many IDs '+targetUID+' '+Object.keys(subIDs).length);
				JSE.jseDataIO.deleteVariable(targetWhat+'/'+targetUID);
			} else {
				let count = 0;
				Object.keys(subIDs).forEach((subID) => {
					if (subIDs[subID] && subIDs[subID].h === 0 && subIDs[subID].a === 0 && subIDs[subID].c === 0) {
						//console.log(targetUID+' '+subID);
						JSE.jseDataIO.hardDeleteVariable(targetWhat+'/'+targetUID+'/'+subID);
						count += 1;
					}
					if (subID.indexOf('badsiteid2com') > -1) {
						console.log(subID);
						JSE.jseDataIO.hardDeleteVariable(targetWhat+'/'+targetUID+'/'+subID);
						count += 1;
					}
				});
				if (count) console.log(targetUID+' '+count);
			}
		}
		//setTimeout(function() {
		if (targetUID < finalUserID) {
			cleanUpSpecificSiteData(targetWhat, targetUID + 1,finalUserID);
		}
		//}, 100);
	});
}

// Clean up siteID and subID stats
function cleanUp(startNo) {
	JSE.jseDataIO.getVariable('nextUserID',function(nextUserID) {
		cleanUpSpecificSiteData('siteIDs',startNo,nextUserID);
		cleanUpSpecificSiteData('subIDs',startNo,nextUserID);
	});
}

function miningMaintenanceAll() {
	JSE.jseDataIO.getVariable('nextUserID',function(nextUserID) {
		for (let i = 0; i < nextUserID; i+=1) {
			JSE.jseDataIO.deleteVariable('mining/'+i+'/');
		}
	});
}

console.log('Waiting for authentication');

function checkAuthenticated() {
	if (typeof JSE.dbAuthenticated !== 'undefined' && typeof JSE.jseSettings !== 'undefined') {
		console.log('Authenticated and loaded settings');
		printLogo();
		console.log("\n\n JSEcoin Console:");
		process.stdout.write('> ');
		const stdin = process.stdin;
		stdin.resume();
		stdin.setEncoding('utf8');
		stdin.on('data', function(key){
			//if ( key === '\u0003' ) process.exit();
			const cleanKey = key.split('\r\n').join('');
			const keySplit = cleanKey.split(' ');
			//console.log(keySplit);
			//console.log("\n");
			if (keySplit[0] === 'get' && keySplit[1]) {
				JSE.jseDataIO.getVariable(keySplit[1],function(reply) {
					if (typeof reply === 'object') {
						console.log(JSON.stringify(reply));
					} else {
						console.log(reply);
					}
					process.stdout.write("\n> ");
				});
			} else if (keySplit[0] === 'set' && keySplit[1] && keySplit[2]) {
				const setString = keySplit.slice(2,99).join(' ');
				JSE.jseDataIO.setVariableThen(keySplit[1],setString, function() {
					console.log('Set '+keySplit[1]+' to '+setString);
					process.stdout.write("\n> ");
				});
			} else if (keySplit[0] === 'setnum' && keySplit[1] && keySplit[2]) {
				const setNum = parseFloat(keySplit.slice(2,99).join(' '));
				JSE.jseDataIO.setVariableThen(keySplit[1],setNum, function() {
					console.log('Setnum '+keySplit[1]+' to '+setNum);
					process.stdout.write("\n> ");
				});
			} else if (keySplit[0] === 'true' && keySplit[1]) {
				JSE.jseDataIO.setVariableThen(keySplit[1],true, function() {
					console.log('Set '+keySplit[1]+' to boolean true');
					process.stdout.write("\n> ");
				});
			} else if (keySplit[0] === 'false' && keySplit[1]) {
				JSE.jseDataIO.setVariableThen(keySplit[1],false, function() {
					console.log('Set '+keySplit[1]+' to boolean false');
					process.stdout.write("\n> ");
				});
			} else if (keySplit[0] === 'keys' && keySplit[1]) {
				JSE.jseDataIO.getVariable(keySplit[1],function(reply) {
					Object.keys(reply).forEach(function(key2) {
						console.log(key2);
					});
					process.stdout.write("\n> ");
				});
			} else if (keySplit[0] === 'del' && keySplit[1]) {
				JSE.jseDataIO.deleteVariable(keySplit[1]);
				console.log('Deleted '+keySplit[1]);
				process.stdout.write("\n> ");
			} else if (keySplit[0] === 'harddel' && keySplit[1]) {
				JSE.jseDataIO.hardDeleteVariable(keySplit[1]);
				console.log('Hard Deleted '+keySplit[1]);
				process.stdout.write("\n> ");
			} else if (keySplit[0] === 'typeof' && keySplit[1]) {
				JSE.jseDataIO.getVariable(keySplit[1],function(reply) {
					console.log(keySplit[1]+' = '+typeof reply);
					process.stdout.write("\n> ");
				});
			} else if (keySplit[0] === 'json' && keySplit[1]) {
				JSE.jseDataIO.getVariable(keySplit[1],function(reply) {
					const jsonFile = './logs/cli-'+keySplit[1].split('/').join('-')+'.json';
					console.log('JSON saved to '+jsonFile);
					fs.writeFileSync(jsonFile, JSON.stringify(reply));
					process.stdout.write("\n> ");
				});
			} else if (cleanKey === 'bkuplocal') {
				bkupAll();
			} else if (cleanKey === 'bkupremote') {
				JSE.jseDataIO.backup();
			} else if (cleanKey === 'updateloader')	{
				updateLoader();
				setTimeout(function() { process.stdout.write("\n> "); }, 2000);
			} else if (cleanKey === 'badstats')	{
				findBadSiteStats();
				setTimeout(function() { process.stdout.write("\n> "); }, 2000);
			} else if (cleanKey === 'cleanup')	{
				cleanUp(0);
			} else if (cleanKey === 'repairstats')	{
				repairBadSiteStats();
				setTimeout(function() { process.stdout.write("\n> "); }, 2000);
			} else if (cleanKey === 'badledger')	{
				findBadDataInLedger();
				setTimeout(function() { process.stdout.write("\n> "); }, 2000);
			} else if (keySplit[0] === 'checkip' && keySplit[1])	{
				JSE.jseFunctions.realityCheck(keySplit[1],function(response) {
					if (response === true) {
						console.log('Good IP');
					} else if (response === false) {
						console.log('Bad IP');
					} else {
						console.log('Response: '+response);
					}
				});
				setTimeout(function() { process.stdout.write("\n> "); }, 2000);
			} else if (cleanKey === 'miningmaintenance')	{
				miningMaintenanceAll();
				setTimeout(function() { process.stdout.write("\n> "); }, 2000);
			} else if (keySplit[0] === 'sysmsg')	{
				const sysMsgString = keySplit.slice(1,99).join(' ');
				JSE.jseDataIO.setVariable('jseSettings/systemMessage',sysMsgString);
				setTimeout(function() { process.stdout.write("\n> "); }, 2000);
			} else if (keySplit[0] === 'rewards' && keySplit[1])	{
				const YYMMDD = keySplit[1];
				console.log('Manually processing rewards for '+YYMMDD);
				manualProcessRewards(YYMMDD);
				setTimeout(function() { process.stdout.write("\n> "); }, 60000);
			} else if (cleanKey === 'runtxt')	{
				runTxt();
				setTimeout(function() { process.stdout.write("\n> "); }, 2000);
			} else if (cleanKey === 'help')	{
				help();
				process.stdout.write("\n> ");
			} else if (cleanKey === 'exit')	{
				console.log("Thanks for using JSE console :)\n");
				process.exit();
			} else if (cleanKey === '') {
				console.log('');
				process.stdout.write("\n> ");
			} else {
				console.log('Command not recognised :(');
				process.stdout.write("\n> ");
			}
		});
	} else if (typeof JSE.dbAuthenticated !== 'undefined') {
		JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
		JSE.jseDataIO.getVariable('blockID',function(result) { JSE.blockID = result; });
		setTimeout(function() { checkAuthenticated(); }, 500);
	} else {
		console.log('.');
		setTimeout(function() { checkAuthenticated(); }, 500);
	}
}
checkAuthenticated();


	////////// custom tools ////////////

function bkupAll() {
	const rootKeys = ['merchantSales','merchantPurchases','locked','lookupExports','lookupEmail','lookupSession','lookupPublicKey','lookupAPIKey','account','blockChain','blockID','credentials','currentBlockString','currentHashes','dailyPublicStats','exported','history','investors','jseSettings','ledger','lottery','mining','nextUserID','passwordResetCodes','platformLottery','previousBlockPreHash','publicStats','registeredIPs','registeredUniques','serverLog','siteIDs','statsDaily','statsToday','statsTotal','subIDs','transactions'];
	// critical, for final update just before reset, change "for (let nextBlockRef = 0; next" to last blockRef and uncomment line below to make sure most important stuff is synced.
	//const rootKeys = ['lookupEmail','lookupSession','lookupPublicKey','lookupAPIKey','account','blockChain','blockID','credentials','exported','history','ledger','nextUserID','previousBlockPreHash'];
	const bkupStartTime = new Date().getTime();
	for (let i = 0; i < rootKeys.length; i+=1) {
		try {
			const rootKey2 = rootKeys[i];
			if (rootKey2 === 'blockChain') {
				JSE.jseDataIO.getVariable('blockID',function(result) {
					JSE.blockID = result;
					const finalBlockRef = JSE.jseDataIO.getBlockRef(JSE.blockID);
					for (let nextBlockRef = 0; nextBlockRef <= finalBlockRef; nextBlockRef+=1) {
						JSE.jseDataIO.getVariable('blockChain/'+nextBlockRef,function(reply) {
							fs.writeFile('./logs/blockChain-'+nextBlockRef+'.json', JSON.stringify(reply), 'utf8', function(err) { // eslint-disable-line
								if (err) { if (JSE.jseTestNet) console.log('ERROR URGENT db.js 191: Error writing backup file'); }
							});
						});
					}
				});
			} else {
			//  write over file using utf8 encoding, may need to change if we accept unicode etc.
				JSE.jseDataIO.getVariable(rootKey2,function(reply) {
					fs.writeFile('./logs/'+rootKey2+'.json', JSON.stringify(reply), 'utf8', function(err) { // eslint-disable-line
						if (err) { if (JSE.jseTestNet) console.log('ERROR URGENT db.js 191: Error writing backup file'); }
					});
				});
			}
		} catch (ex) {
			console.log('Failed backup jse.js 288 '+ex.message);
		}
	}
}

/**
 * @method <h2>manualProcessRewards</h2>
 * @description Move the rewards across to the ledger for a certain date.
 * 							Included but commented out is the option to add to block data and history as well depending on if this has been done already
 * 							Uncomment the final line /d true as well if this hasn't been done. Hard delete month old data has been removed. May need doing manually.
 * 							!rewards[uid][lastWeekYYMMDD].d check removed
 * 							Rewards are aggregated then sent all at once at the end on line 453.
 * 							If YYMMDD = 7 days back then it will automatically run cleanRewads for month old ones after 15secs
 * 							If the publisher rewards breaks then so will resetDailyStatsManually(); which has been added.
 * @param YYMMDD the date we want to process manually.
 */
function manualProcessRewards(YYMMDD) {
	const lastWeekYYMMDD = YYMMDD;
	JSE.jseDataIO.getVariable('rewards',function(rewards) {
		console.log('Rewards Pending Data Returned For '+lastWeekYYMMDD+' - '+Object.keys(rewards).length+' Users');
		Object.keys(rewards).forEach(function(uid) {
			if (!uid || !rewards[uid]) return; // check for blank uids and skip any uid's with no pending rewards
			if (rewards[uid][lastWeekYYMMDD] && !rewards[uid][lastWeekYYMMDD].d) {
			//if (rewards[uid][lastWeekYYMMDD]) {
				console.log('# UID: '+uid);
				let totalPending = 0;
				if (rewards[uid][lastWeekYYMMDD].s) { // s = self-mining
					const jsePlatformReward = rewards[uid][lastWeekYYMMDD].s;
					totalPending += jsePlatformReward;
					console.log(jsePlatformReward);
					//JSE.jseDataIO.plusX('ledger/'+uid, jsePlatformReward);
					/** comment out below to prevent history and block data */
					const newPlatformData = {};
					newPlatformData.command = 'platformReward';
					newPlatformData.reference = 'Platform Mining Reward '+lastWeekYYMMDD;
					newPlatformData.user1 = uid;
					newPlatformData.value = jsePlatformReward;
					newPlatformData.ts = new Date().getTime();
					JSE.jseDataIO.pushBlockData(newPlatformData,function(blockData) {});
					JSE.jseDataIO.pushVariable('history/'+uid,newPlatformData,function(pushRef) {});
				}
				if (rewards[uid][lastWeekYYMMDD].p) { // p = publisher mining
					const jsePublisherReward = rewards[uid][lastWeekYYMMDD].p;
					totalPending += jsePublisherReward;
					console.log(jsePublisherReward);
					//JSE.jseDataIO.plusX('ledger/'+uid, jsePublisherReward);
					const newPublisherData = {};
					newPublisherData.command = 'publisherReward';
					newPublisherData.reference = 'Publisher Mining Reward '+lastWeekYYMMDD;
					newPublisherData.user1 = uid;
					newPublisherData.value = jsePublisherReward;
					newPublisherData.ts = new Date().getTime();
					JSE.jseDataIO.pushBlockData(newPublisherData,function(blockData) {});
					JSE.jseDataIO.pushVariable('history/'+uid,newPublisherData,function(pushRef) {});
				}
				if (rewards[uid][lastWeekYYMMDD].r) { // r = referral
					const jseReferralReward = rewards[uid][lastWeekYYMMDD].r;
					totalPending += jseReferralReward;
					console.log(jseReferralReward);
					//JSE.jseDataIO.plusX('ledger/'+uid, jseReferralReward);
					const newReferralData = {};
					newReferralData.command = 'referralReward';
					newReferralData.reference = 'Referral Reward '+lastWeekYYMMDD;
					newReferralData.user1 = uid;
					newReferralData.value = jseReferralReward;
					newReferralData.ts = new Date().getTime();
					JSE.jseDataIO.pushBlockData(newReferralData,function(blockData) {});
					JSE.jseDataIO.pushVariable('history/'+uid,newReferralData,function(pushRef) {});
				}
				console.log(uid+' = '+totalPending);
				JSE.jseDataIO.plusX('ledger/'+uid, totalPending);
				JSE.jseDataIO.setVariable('rewards/'+uid+'/'+lastWeekYYMMDD+'/d',true); // d = done
			}
		});
	});
	// clean up rewards after processing
	const lastWeek = new Date();
	lastWeek.setDate(lastWeek.getDate()-7);
	const lastWeekYYMMDD2 = lastWeek.toISOString().slice(2,10).replace(/-/g,"");
	if (lastWeekYYMMDD2 === lastWeekYYMMDD) {
		setTimeout(function () { cleanRewards(); }, 15);
		//setTimeout(function() { resetDailyStatsManually(); }, 25);
	}
}

function cleanRewards() {
	const lastMonth = new Date();
	lastMonth.setDate(lastMonth.getDate()-28);
	const lastMonthYYMMDD = lastMonth.toISOString().slice(2,10).replace(/-/g,"");
	JSE.jseDataIO.getVariable('rewards',function(rewards) {
		console.log('Rewards Pending Data Returned For '+lastMonthYYMMDD+' - '+Object.keys(rewards).length+' Users');
		Object.keys(rewards).forEach(function(uid) {
			if (!uid || !rewards[uid]) return; // check for blank uids and skip any uid's with no pending rewards
			if (rewards[uid][lastMonthYYMMDD]) {
				console.log('Cleaning rewards for: rewards/'+uid+'/'+lastMonthYYMMDD);
				JSE.jseDataIO.hardDeleteVariable('rewards/'+uid+'/'+lastMonthYYMMDD); // clean up after one month?
			}
		});
	});
}

function importJSONFile(key, fileLocation) {
	const newObj = require(fileLocation); // eslint-disable-line
	console.log('Writing '+Object.keys(newObj).length+' fields to '+key);
	JSE.jseDataIO.setVariableThen(key, newObj, function() {
			console.log('Imported: '+key);
	});
}

function importBigJSONFile(key, fileLocation) {
	const newObj = require(fileLocation); // eslint-disable-line
	console.log('Writing '+Object.keys(newObj).length+' fields to '+key);
	let c = 0;
	Object.keys(newObj).forEach(function(subKey) {
		c += 1;
		const fullKey = key+'/'+subKey;
		//console.log(fullKey);
		setTimeout(function(fk,ob) {
			JSE.jseDataIO.setVariableThen(fk, ob, function() {
				//console.log(fk);
			});
		}, c, fullKey, newObj[subKey]);
	});
}

function importEntireDB() {
	// need to do this is
	const directory = './../../bkup/2018/February/180202/';
	const files = ['ledger.json','account180202B.json','credentials180202B.json','exported180202A.json','history180202A.json','ledger180202B.json','siteIDs180202A.json','statsTotal180202A.json','subIDs180202A.json'];
	//var files = ['siteIDs180202A.json','statsTotal180202A.json','subIDs180202A.json'];
	//1. var files = ['account180202B.json','credentials180202B.json'];
	//2. var files = ['exported180202A.json','ledger180202B.json','subIDs180202A.json'];
	//3. var files = ['history180202A.json'];
	//4.  var files = ['siteIDs180202A.json','statsTotal180202A.json'];

	for (let i = 0; i < files.length; i+=1) {
		const fullPath = directory+files[i];
		const key = files[i].split('1')[0];
		importJSONFile(key,fullPath);
	}
	console.log('Sent Data! Wait for confirmation that files are individually imported.');
}


function buildLookupTables() {
	JSE.jseDataIO.setVariable('publicStats/clients',{}); // not really lookup table but needed
	JSE.jseDataIO.setVariable('lookupExports',{});
	JSE.jseDataIO.setVariable('lookupEmail',{});
	JSE.jseDataIO.setVariable('lookupSession',{});
	JSE.jseDataIO.setVariable('lookupPublicKey',{});
	JSE.jseDataIO.setVariable('lookupAPIKey',{});
	//JSE.jseDataIO.setVariable('history',{});
	//JSE.jseDataIO.setVariable('mining',{});
	//JSE.jseDataIO.setVariable('statsTotal',{});
	//JSE.jseDataIO.setVariable('siteIDs',{});
	//JSE.jseDataIO.setVariable('subIDs',{});

	JSE.jseDataIO.getVariable('credentials',function(allCredentials) {
		Object.keys(allCredentials).forEach(function(uidKey) {
			if (allCredentials[uidKey]) {
				const credentials = allCredentials[uidKey];

				console.log(credentials.uid + ': '+credentials.email);
				JSE.jseDataIO.setVariable('lookupExports/'+credentials.uid,{});
				JSE.jseDataIO.setVariable('lookupEmail/'+credentials.email,credentials.uid);
				JSE.jseDataIO.setVariable('lookupSession/'+credentials.session,credentials.uid);
				JSE.jseDataIO.setVariable('lookupPublicKey/'+credentials.publicKey,credentials.uid);
				JSE.jseDataIO.setVariable('lookupAPIKey/'+credentials.apiKey,credentials.uid);
				//JSE.jseDataIO.setVariable('history/'+credentials.uid,{});
				JSE.jseDataIO.setVariable('mining/'+credentials.uid,{});
				//JSE.jseDataIO.setVariable('statsTotal/'+credentials.uid,{});
				//JSE.jseDataIO.setVariable('siteIDs/'+credentials.uid,{});
				//JSE.jseDataIO.setVariable('subIDs/'+credentials.uid,{});
			}
		});
		JSE.jseDataIO.getVariable('exported',function(exported) {
			Object.keys(exported).forEach(function(key) {
				const uid = exported[key].uid;
				JSE.jseDataIO.pushVariable('lookupExports/'+uid,exported[key].coinCode,function(pushRef) {});
			});
		});
	});
}


//////////// work.js functions ///////////

function banUser(uid,banReason) {
	JSE.jseDataIO.setVariable('credentials/'+uid+'/suspended',now);
	JSE.jseDataIO.setVariable('account/'+uid+'/suspended',now);
	JSE.jseDataIO.setVariable('account/'+uid+'/adminNotes',banReason);
	console.log('banned '+uid);
}

function deleteUser(uid) {
	JSE.jseDataIO.setVariable('credentials/'+uid+'/suspended',now);
	JSE.jseDataIO.setVariable('account/'+uid+'/suspended',now);
	JSE.jseDataIO.setVariable('account/'+uid+'/email','deleted@jsecoin.com');
	console.log('Deleted '+uid);
}

function pushDailyPublicStats() {
	JSE.jseDataIO.getVariable('publicStats',function(publicStats) {
		const json = JSON.stringify(publicStats);
		console.log(json);
		const publicStatsTS = publicStats;
		publicStatsTS.ts = new Date().getTime();
		JSE.jseDataIO.pushVariable('dailyPublicStats',publicStatsTS,function(pushRef) {});
	});
}

function resetDailyStatsManually() {
	JSE.jseDataIO.buildLedger(function(ledger) {
		const publicLedger = ledger;
		JSE.jseDataIO.updatePublicStats();
		setTimeout(function() {
			console.log('Coins: '+JSE.publicStats.coins);
			JSE.publicStats.ts = new Date().getTime();
			JSE.jseDataIO.pushVariable('dailyPublicStats',JSE.publicStats,function(pushRef) {});
			console.log('Pushed out daily stats');
		}, 10000);
		JSE.jseDataIO.resetDailyStats();
	});
}

function copyOverUser(newUserID) {
 // account 731 is a deleted user
	JSE.jseDataIO.getVariable('account/731',function(returnObject) {
		const newUser = returnObject;
		newUser.name = 'Blank User';
		newUser.uid = newUserID;
		newUser.registrationDate = new Date().getTime();
		JSE.jseDataIO.setVariable('account/'+newUserID,newUser);
	});
	JSE.jseDataIO.getVariable('credentials/731',function(returnObject) {
		const newUser = returnObject;
		newUser.uid = newUserID;
		JSE.jseDataIO.setVariable('credentials/'+newUserID,newUser);
	});
	JSE.jseDataIO.setVariable('ledger/'+newUserID,0);
}

function updateStats() {
	JSE.jseDataIO.buildLedger(function(ledger) {
		JSE.publicLedger = ledger;
		JSE.jseDataIO.updatePublicStats();
	});
}

///////////// tests //////////////

JSE.jseDataIO.getVariable('previousBlockPreHash', function(reply) {
	console.log('Got variable: '+JSON.stringify(reply));
});
