/**
 * @module jseSocketIO
 * @description Socket.io Server used for coms with mining clients and peers<br>
 * Server has four core functions:
 * <ul>
 * <li>Receive mining connections</li>
 * <li>p2p server for incomming connections</li>
 * <li>Blockchain explorer functions</li>
 * <li>Finally send out new preHashes and Blocks (to miners and p2p block subscribers)</li>
 * </ul>
 * <h5>Exported</h5>
 * <ul><li>jseSocketIO</li></ul>
 */

const JSE = global.JSE;
const fs = require('fs'); // only required temporarily for testing
const request = require('request');

const jseLottery = require("./lottery.js");

JSE.socketConnections = {}; // incoming connections to the server, includes miners and peers

const jseSocketIO = {

/**
 * @method <h2>startServer</h2>
 * @description Start up the socket IO server, called from jsenode.js
 * @param {object} server http server object
 * @param {object} io socketio object
 */
	startServer(server,io) {
		function onConnection(socket){
			JSE.socketConnections[socket.id] = socket;
			socket.on('disconnect', function() {
				if (JSE.peerList[socket.id] !== 'undefined') {
					if (JSE.jseTestNet) console.log('Removing peer from peerlist: '+socket.id); // getting a lot of these on the load servers despite there not being any p2p connections???
					JSE.peerList[socket.id] = null; // free for garbage collection;
					delete JSE.peerList[socket.id];
				}
				if (JSE.socketConnections[socket.id] !== 'undefined') {
					JSE.socketConnections[socket.id] = null;
					delete JSE.socketConnections[socket.id];
				}
				//console.log(JSON.stringify(peerList));
			});
			JSE.socketConnections[socket.id].realIP = socket.handshake.headers["x-real-ip"] || socket.handshake.headers["x-forwarded-for"] || socket.handshake.address || 'unknownIP';
			if (JSE.socketConnections[socket.id].realIP.indexOf(',') > -1) { JSE.socketConnections[socket.id].realIP = JSE.socketConnections[socket.id].realIP.split(',')[0]; }
			if (JSE.socketConnections[socket.id].realIP.indexOf(':') > -1) { JSE.socketConnections[socket.id].realIP = JSE.socketConnections[socket.id].realIP.split(':').slice(-1)[0]; }
			if (JSE.jseTestNet) console.log('SOCKET CONNECTION made from '+socket.realIP);

			/** P2P Connections */

			// Respond to peer list with our current version of the peerList
			socket.on('peerList', function(theirPeerList, theirVersion, theirHost, theirPort, callback) {
				console.log('peerList Request From '+theirVersion+' on '+socket.realIP+' : '+theirPort);
				callback(JSE.peerList,JSE.blockID,JSE.jseSettings);
			});

			// Respond to helloWorld, equivalent of version
			socket.on('helloWorld', function(theirVersion, theirHost, theirPort, callback) {
				if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					JSE.socketConnections[socket.id].miningType = 0; // not a miner
					JSE.socketConnections[socket.id].realPort = theirPort || 80; // set port number delivered from the client in server.js
				}
				const peerListEntry = {
					server: socket.realIP, port: theirPort, sockID: socket.id, trust: 0,
				};

				let alreadyAdded = false;
				if (JSE.peerList[socket.id]) {
					Object.keys(JSE.peerList[socket.id]).forEach(function(key) {
						if (JSE.peerList[socket.id][key].host === theirHost && JSE.peerList[socket.id][key].port === theirPort) {
							alreadyAdded = true;
						}
					});
				}
				if (alreadyAdded === false) {
					JSE.peerList[socket.id] = peerListEntry;
				}
				console.log('helloWorld Connection From '+theirVersion+' on '+socket.realIP+' : '+socket.realPort+' added to peerList');
				if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					JSE.socketConnections[socket.id].clientVersion = theirVersion;
				}
				callback(JSE.jseVersion);
			});

			// Respond to chainUpdate request for the latest blockChain
			socket.on('chainUpdate', function(theirBlockRefRaw, theirBlockIDRaw, callback) {
				let theirBlockID = theirBlockIDRaw;
				let theirBlockRef = theirBlockRefRaw;
				if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					console.log('chainUpdate Request From '+JSE.socketConnections[socket.id].clientVersion+' on '+JSE.socketConnections[socket.id].realIP+' : '+JSE.socketConnections[socket.id].realPort);
				}
				if (theirBlockID === null) theirBlockID = JSE.blockID; // needs updating?
				if (theirBlockRef === null) theirBlockRef = JSE.jseDataIO.getBlockRef(theirBlockID);
				if (JSE.authenticatedNode) {
					JSE.jseDataIO.getVariable('blockChain/'+theirBlockRef,function(oneThousandBlocks) {
						callback(oneThousandBlocks,theirBlockRef,theirBlockID);
					});
				} else {
					console.log('chainUpdate returning null');
					if (typeof JSE.currentChain[theirBlockRef] !== 'undefined') {
						callback(JSE.currentChain[theirBlockRef],null,null);
					}
				}
			});

			socket.on('subscribeToNewBlocks', function(theirBlockID) {
				if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					console.log('subscribeToNewBlocks Request From '+JSE.socketConnections[socket.id].clientVersion+' on '+JSE.socketConnections[socket.id].realIP+' : '+JSE.socketConnections[socket.id].realPort);
					JSE.socketConnections[socket.id].blockSubscribed = true;
					JSE.socketConnections[socket.id].blocksSent = [];
				}
			});


			/**
			 * @function <h2>checkSessionValid</h2>
			 * @description Checks a session variable is valid and callsback true / false
			 * @param {integar} uid user ID
			 * @param {string} session session key
			 * @param {function} callback function is passsed either true for valid or false for invalid
			 */
			function checkSessionValid(uid, session, callback) {
				JSE.jseDataIO.lookupSession(session,function(sUID) {
					if (parseInt(sUID,10) === parseInt(uid,10)) {
						callback(true);
					} else {
						callback(false);
					}
				});
			}

			/** Platform Login Connections */

			socket.on('registerSession', function(uid,session,callback) {
				if (typeof callback === "function") {
					if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
						JSE.socketConnections[socket.id].uid = uid;
						JSE.socketConnections[socket.id].session = session;
						JSE.socketConnections[socket.id].miningType = 2;
						// these aren't verified so need to check they match if any critical data is being sent
						if (JSE.vpnData[socket.realIP] && JSE.vpnData[socket.realIP] === true) {
							JSE.socketConnections[socket.id].goodIP = true;
							checkSessionValid(uid, session, callback);
						} else if (JSE.vpnData[socket.realIP] && JSE.vpnData[socket.realIP] === false) {
							JSE.socketConnections[socket.id].goodIP = false;
							callback(false);
						} else {
							JSE.jseFunctions.realityCheck(socket.realIP, function(goodIPTrue) {
								if (goodIPTrue === true && typeof JSE.socketConnections[socket.id] !== 'undefined') {
									JSE.socketConnections[socket.id].goodIP = true;
									checkSessionValid(uid, session, callback);
								} else if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
									JSE.socketConnections[socket.id].goodIP = false;
									callback(false);
								}
							});
						}
					}
					if (JSE.jseTestNet) console.log('registerSession from '+uid);
				} else if (JSE.jseTestNet) {
					console.log('Error socketio.js 143: callback not a function '+uid);
				}
			});

			/** Mining Connections */

			/**
			 * @function <h2>buildOptInAuthKey</h2>
			 * @description Create a unique key for each user to use as an authorization key
			 * @param {object} jseTrack browser data object
			 * @returns {string} SHA256 authorization key
			 */
			function buildOptInAuthKey(jseTrack) {
				const jseFP = [];
				jseFP.push(JSE.credentials.minerAuthKeySeed);
				jseFP.push(jseTrack.language || 1);
				jseFP.push(jseTrack.languages || 1);
				jseFP.push(jseTrack.timeZoneOffset + 24 || 1);
				jseFP.push(jseTrack.platform || 1);
				if (jseTrack.userAgent && jseTrack.userAgent.split) {
					jseFP.push(jseTrack.userAgent.split(/[^a-zA-Z]/).join('') || 1);
				} else {
					jseFP.push(1);
				}
				jseFP.push(jseTrack.appName || 1);
				jseFP.push(jseTrack.screen || 1);
				jseFP.push(jseTrack.deviceMemory || 1);
				jseFP.push(jseTrack.protoString || 1);
				const jseFingerPrint = jseFP.join('').split(/[^a-zA-Z0-9]/).join('');
				if (JSE.jseTestNet) console.log(jseFingerPrint);
				const testAuthKey = JSE.jseFunctions.sha256(jseFingerPrint);
				return testAuthKey;
			}

			/**
			 * @function <h2>recordMLData</h2>
			 * @description Record last 100 impressions in a tensor ready for machine learning
			 * @param {array} visitorTensor Two diemnsional array created in calculateInitialRating function
			 */
			function recordMLData(pubID,visitorTensor) {
				if (parseInt(pubID,10) !== pubID || !pubID > 0) return false;
				JSE.jseDataIO.getVariable('publisherMLData/'+pubID,function(publisherMLData) {
					let pubData = publisherMLData;
					if (!pubData) {
						pubData = [];
					}
					let duplicateFieldCount = 0;
					pubData.forEach((tensor,tensorKey) => {
						tensor.forEach((field,fieldKey) => {
							if (visitorTensor[fieldKey] && visitorTensor[fieldKey] === field) {
								duplicateFieldCount += 1;
							}
						});
					});
					const dupeTotal = Math.round(duplicateFieldCount / pubData.length);
					visitorTensor.push(dupeTotal);
					pubData.unshift(visitorTensor);
					if (pubData.length > 100) {
						pubData = pubData.slice(0, 100);
					}
					JSE.jseDataIO.setVariable('publisherMLData/'+pubID,pubData);
				});
				return false;
			}

			/**
			 * @function <h2>calculateInitialRating</h2>
			 * @description Calculate an initial rating of client quality and format data for TensorFlow
			 * @param {object} jseTrack browser data object
			 * @returns {int} initial rating -99 - 99
			 */
			function calculateInitialRating(jseTrack) {
				let initialRating = 0;
				const pubID = parseInt(JSE.jseFunctions.cleanString(jseTrack.pubID) || 1,10);

				const visitorTensor = []; // setup visitor machine learning data

        // User Agent Check
        const botRegEx = new RegExp("(googlebot|Googlebot-Mobile|Googlebot-Image|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|headless|puppeteer|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|tagoobot|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|AddThis)", 'i');
        const mobileRegEx = new RegExp("(Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune)", 'i');
				const desktopRegEx = new RegExp("(Win64|CrOS|Mac( ||-)OS( ||-)X|WOW64|Windows NT)", 'i');
				let deviceType = 0;
        if (botRegEx.test(jseTrack.userAgent)) {
					initialRating = -99;
					deviceType = 1;
        } else if (mobileRegEx.test(jseTrack.userAgent)) {
					initialRating = 10;
					deviceType = 2;
        } else if (desktopRegEx.test(jseTrack.userAgent)) {
					initialRating = 10;
					deviceType = 3;
				}
				visitorTensor.push(deviceType);

				// Browser Check
				let browserType = 0;
				const userAgentLC = String(jseTrack.userAgent).toLowerCase();
				if (userAgentLC.indexOf('chrome') > -1)	browserType = 1;
				if (userAgentLC.indexOf('firefox') > -1) browserType = 2;
				if (userAgentLC.indexOf('opera') > -1) browserType = 3;
				if (userAgentLC.indexOf('safari') > -1) browserType = 4;
				if (userAgentLC.indexOf('edge') > -1) browserType = 5;
				if (userAgentLC.indexOf('msie') > -1) browserType = 6;
				visitorTensor.push(browserType);

				let browserCheck = 0;
				if (jseTrack.browserCheck) {
					initialRating += 10;
					browserCheck = 1;
				} else {
					initialRating -= 10;
				}
				visitorTensor.push(browserCheck);

				// Check Timezone Offset Matches GEO
        const geo = jseTrack.geo || 'XX';
        const timezoneOffset = String(jseTrack.timezoneOffset || 0);
				const timeZones = [["AF","+04:30"],["AX","+02:00"],["AL","+01:00"],["DZ","+01:00"],["AS","-11:00"],["AD","+01:00"],["AO","+01:00"],["AI","-04:00"],["AQ","+08:00"],["AQ","+07:00"],["AQ","+10:00"],["AQ","+05:00"],["AQ","+13:00"],["AQ","-03:00"],["AQ","-03:00"],["AQ","+03:00"],["AQ","+06:00"],["AG","-04:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AR","-03:00"],["AM","+04:00"],["AW","-04:00"],["AU","+11:00"],["AU","+10:30"],["AU","+10:00"],["AU","+10:30"],["AU","+11:00"],["AU","+09:30"],["AU","+08:45"],["AU","+11:00"],["AU","+10:00"],["AU","+11:00"],["AU","+11:00"],["AU","+08:00"],["AU","+11:00"],["AT","+01:00"],["AZ","+04:00"],["BS","-05:00"],["BH","+03:00"],["BD","+06:00"],["BB","-04:00"],["BY","+03:00"],["BE","+01:00"],["BZ","-06:00"],["BJ","+01:00"],["BM","-04:00"],["BT","+06:00"],["BO","-04:00"],["BQ","-04:00"],["BA","+01:00"],["BW","+02:00"],["BR","-03:00"],["BR","-03:00"],["BR","-03:00"],["BR","-04:00"],["BR","-03:00"],["BR","-03:00"],["BR","-05:00"],["BR","-03:00"],["BR","-03:00"],["BR","-04:00"],["BR","-02:00"],["BR","-04:00"],["BR","-03:00"],["BR","-05:00"],["BR","-03:00"],["BR","-02:00"],["IO","+06:00"],["VG","-04:00"],["BN","+08:00"],["BG","+02:00"],["BI","+02:00"],["KH","+07:00"],["CM","+01:00"],["CA","-05:00"],["CA","-04:00"],["CA","-07:00"],["CA","-07:00"],["CA","-08:00"],["CA","-07:00"],["CA","-07:00"],["CA","-07:00"],["CA","-04:00"],["CA","-04:00"],["CA","-04:00"],["CA","-07:00"],["CA","-05:00"],["CA","-04:00"],["CA","-05:00"],["CA","-05:00"],["CA","-06:00"],["CA","-06:00"],["CA","-06:00"],["CA","-06:00"],["CA","-03:30"],["CA","-06:00"],["CA","-05:00"],["CA","-05:00"],["CA","-08:00"],["CA","-08:00"],["CA","-06:00"],["CA","-07:00"],["CV","-01:00"],["KY","-05:00"],["CF","+01:00"],["TD","+01:00"],["CL","-03:00"],["CL","-03:00"],["CL","-05:00"],["CN","+08:00"],["CN","+06:00"],["CX","+07:00"],["CC","+06:30"],["CO","-05:00"],["KM","+03:00"],["CK","-10:00"],["CR","-06:00"],["HR","+01:00"],["CU","-05:00"],["CW","-04:00"],["CY","+02:00"],["CY","+02:00"],["CZ","+01:00"],["CD","+01:00"],["CD","+02:00"],["DK","+01:00"],["DJ","+03:00"],["DM","-04:00"],["DO","-04:00"],["TL","+09:00"],["EC","-05:00"],["EC","-06:00"],["EG","+02:00"],["SV","-06:00"],["GQ","+01:00"],["ER","+03:00"],["EE","+02:00"],["ET","+03:00"],["FK","-03:00"],["FO","0"],["FJ","+13:00"],["FI","+02:00"],["FR","+01:00"],["GF","-03:00"],["PF","-09:00"],["PF","-09:30"],["PF","-10:00"],["TF","+05:00"],["GA","+01:00"],["GM","0"],["GE","+04:00"],["DE","+01:00"],["DE","+01:00"],["GH","0"],["GI","+01:00"],["GR","+02:00"],["GL","0"],["GL","-03:00"],["GL","-01:00"],["GL","-04:00"],["GD","-04:00"],["GP","-04:00"],["GU","+10:00"],["GT","-06:00"],["GG","0"],["GN","0"],["GW","0"],["GY","-04:00"],["HT","-05:00"],["HN","-06:00"],["HK","+08:00"],["HU","+01:00"],["IS","0"],["IN","+05:30"],["ID","+07:00"],["ID","+09:00"],["ID","+08:00"],["ID","+07:00"],["IR","+03:30"],["IQ","+03:00"],["IE","0"],["IM","0"],["IL","+02:00"],["IT","+01:00"],["CI","0"],["JM","-05:00"],["JP","+09:00"],["JE","0"],["JO","+02:00"],["KZ","+06:00"],["KZ","+05:00"],["KZ","+05:00"],["KZ","+05:00"],["KZ","+05:00"],["KZ","+06:00"],["KE","+03:00"],["KI","+13:00"],["KI","+14:00"],["KI","+12:00"],["KW","+03:00"],["KG","+06:00"],["LA","+07:00"],["LV","+02:00"],["LB","+02:00"],["LS","+02:00"],["LR","0"],["LY","+02:00"],["LI","+01:00"],["LT","+02:00"],["LU","+01:00"],["MO","+08:00"],["MK","+01:00"],["MG","+03:00"],["MW","+02:00"],["MY","+08:00"],["MY","+08:00"],["MV","+05:00"],["ML","0"],["MT","+01:00"],["MH","+12:00"],["MH","+12:00"],["MQ","-04:00"],["MR","0"],["MU","+04:00"],["YT","+03:00"],["MX","-06:00"],["MX","-05:00"],["MX","-07:00"],["MX","-07:00"],["MX","-06:00"],["MX","-07:00"],["MX","-06:00"],["MX","-06:00"],["MX","-06:00"],["MX","-07:00"],["MX","-08:00"],["FM","+10:00"],["FM","+11:00"],["FM","+11:00"],["MD","+02:00"],["MC","+01:00"],["MN","+08:00"],["MN","+07:00"],["MN","+08:00"],["ME","+01:00"],["MS","-04:00"],["MA","+01:00"],["MZ","+02:00"],["MM","+06:30"],["NA","+02:00"],["NR","+12:00"],["NP","+05:45"],["NL","+01:00"],["NC","+11:00"],["NZ","+13:00"],["NZ","+13:45"],["NI","-06:00"],["NE","+01:00"],["NG","+01:00"],["NU","-11:00"],["NF","+11:00"],["KP","+09:00"],["MP","+10:00"],["NO","+01:00"],["OM","+04:00"],["PK","+05:00"],["PW","+09:00"],["PS","+02:00"],["PS","+02:00"],["PA","-05:00"],["PG","+11:00"],["PG","+10:00"],["PY","-03:00"],["PE","-05:00"],["PH","+08:00"],["PN","-08:00"],["PL","+01:00"],["PT","-01:00"],["PT","0"],["PT","0"],["PR","-04:00"],["QA","+03:00"],["CG","+01:00"],["RE","+04:00"],["RO","+02:00"],["RU","+12:00"],["RU","+07:00"],["RU","+09:00"],["RU","+08:00"],["RU","+12:00"],["RU","+09:00"],["RU","+07:00"],["RU","+11:00"],["RU","+07:00"],["RU","+07:00"],["RU","+06:00"],["RU","+11:00"],["RU","+11:00"],["RU","+07:00"],["RU","+10:00"],["RU","+10:00"],["RU","+09:00"],["RU","+05:00"],["RU","+04:00"],["RU","+02:00"],["RU","+03:00"],["RU","+03:00"],["RU","+04:00"],["RU","+04:00"],["RU","+03:00"],["RU","+04:00"],["RU","+04:00"],["RW","+02:00"],["BL","-04:00"],["SH","0"],["KN","-04:00"],["LC","-04:00"],["MF","-04:00"],["PM","-03:00"],["VC","-04:00"],["WS","+14:00"],["SM","+01:00"],["ST","+01:00"],["SA","+03:00"],["SN","0"],["RS","+01:00"],["SC","+04:00"],["SL","0"],["SG","+08:00"],["SX","-04:00"],["SK","+01:00"],["SI","+01:00"],["SB","+11:00"],["SO","+03:00"],["ZA","+02:00"],["GS","-02:00"],["KR","+09:00"],["SS","+03:00"],["ES","+01:00"],["ES","0"],["ES","+01:00"],["LK","+05:30"],["SD","+02:00"],["SR","-03:00"],["SJ","+01:00"],["SZ","+02:00"],["SE","+01:00"],["CH","+01:00"],["SY","+02:00"],["TW","+08:00"],["TJ","+05:00"],["TZ","+03:00"],["TH","+07:00"],["TG","0"],["TK","+13:00"],["TO","+13:00"],["TT","-04:00"],["TN","+01:00"],["TR","+03:00"],["TM","+05:00"],["TC","-05:00"],["TV","+12:00"],["VI","-04:00"],["UG","+03:00"],["UA","+02:00"],["UA","+02:00"],["UA","+02:00"],["AE","+04:00"],["GB","0"],["US","-10:00"],["US","-09:00"],["US","-07:00"],["US","-06:00"],["US","-07:00"],["US","-05:00"],["US","-05:00"],["US","-06:00"],["US","-05:00"],["US","-05:00"],["US","-06:00"],["US","-05:00"],["US","-05:00"],["US","-05:00"],["US","-09:00"],["US","-05:00"],["US","-05:00"],["US","-08:00"],["US","-06:00"],["US","-09:00"],["US","-05:00"],["US","-09:00"],["US","-06:00"],["US","-06:00"],["US","-06:00"],["US","-07:00"],["US","-09:00"],["US","-09:00"],["US","-10:00"],["UM","-11:00"],["UM","+12:00"],["UY","-03:00"],["UZ","+05:00"],["UZ","+05:00"],["VU","+11:00"],["VA","+01:00"],["VE","-04:00"],["VN","+07:00"],["WF","+12:00"],["EH","+01:00"],["YE","+03:00"],["ZM","+02:00"],["ZW","+02:00"]];
				let timeZoneMatch = 0;
        for (let i = 0; i < timeZones.length; i+=1) {
          if (geo === timeZones[i][0]) {
            if (timezoneOffset === timeZones[i][1]) {
              //console.log('Timezone match :)');
							initialRating += 10;
							timeZoneMatch += 1;
            }
          }
				}
				visitorTensor.push(timeZoneMatch);
				// Check site and referrer, could do more with this
				if (jseTrack.referrer && (String(jseTrack.referrer).indexOf('.com') > -1 || jseTrack.siteID.indexOf('.com'))) initialRating += 5;
				if (jseTrack.referrer && (String(jseTrack.referrer).indexOf('.edu') > -1 || jseTrack.siteID.indexOf('.edu'))) initialRating += 5;
				if (jseTrack.referrer && (String(jseTrack.referrer).indexOf('.org') > -1 || jseTrack.siteID.indexOf('.org'))) initialRating += 2;
				if (jseTrack.referrer && (String(jseTrack.referrer).indexOf('.org') > -1 || jseTrack.siteID.indexOf('.org'))) initialRating += 2;
				let goodReferrer = 0;
				if (jseTrack.referrer && /(google.com|facebook.com|youtube.com|twitter.com|microsoft.com|linkedin.com|instagram.com|wikipedia.org|plus.google.com|apple.com|adobe.com|wikipedia.org|apple.com|vimeo.com|pinterest.com|yahoo.com|amazon.com|github.com|nytimes.com|reddit.com|bbc.co.uk|cnn.com|theguardian.com|forbes.com|msn.com|bing.com|imdb.com|slideshare.net|reuters.com|live.com|medium.com|bloomberg.com|mit.edu|stanford.edu|harvard.edu)/.test(jseTrack.referrer)) {
					initialRating += 10;
					goodReferrer = 1;
				}
				visitorTensor.push(goodReferrer);
				let languageMatch = 0;
        if (String(jseTrack.language).indexOf(jseTrack.geo) > -1) {
					initialRating += 5;
					languageMatch = 1;
				}
				visitorTensor.push(languageMatch);
        if (jseTrack.innerWidth > 250 && jseTrack.innerHeight > 250 && jseTrack.screenDepth > 16 && jseTrack.innerWidth < jseTrack.screenWidth && jseTrack.innerHeight < jseTrack.screenHeight) {
          initialRating += 5;
				}
				visitorTensor.push(jseTrack.screenWidth);
				visitorTensor.push(jseTrack.screenHeight);
				visitorTensor.push(jseTrack.innerWidth);
				visitorTensor.push(jseTrack.innerHeight);
        if (jseTrack.deviceMemory > 2) {
          initialRating += 5;
				}
				visitorTensor.push(jseTrack.deviceMemory);
				let webGLTest = 0;
        if (jseTrack.webGL) {
					webGLTest = 1;
          initialRating += 5;
				}
				visitorTensor.push(webGLTest);

        if (jseTrack.storage && parseInt(jseTrack.storage,10) === jseTrack.storage) {
					visitorTensor.push(jseTrack.storage);
					if (jseTrack.storage > 10) {
						initialRating += 10;
					} else {
						initialRating += jseTrack.storage;
					}
				} else {
					visitorTensor.push(0);
				}

				visitorTensor.push(jseTrack.movement);
				visitorTensor.push(jseTrack.timeFactor);
				visitorTensor.push(jseTrack.elementsFactor);
				visitorTensor.push(jseTrack.initialRating);

				recordMLData(pubID,visitorTensor);
	    	return initialRating;
			}

			socket.on('saveUnique', function(jseTrack) {
				try {
					const pubID = JSE.jseFunctions.cleanString(jseTrack.pubID) || 1; // jseTrack.pubID = uid
					const siteID = JSE.jseFunctions.cleanString(jseTrack.siteID) || 1;
					const subID = JSE.jseFunctions.cleanString(jseTrack.subID) || 1;
					if (jseTrack.iFrame && jseTrack.iFrame === true) { return false; }
					JSE.publisherIPs.push(socket.realIP);
					jseLottery.credit(pubID,siteID,subID,'unique');
				} catch (ex) {
					console.log('SaveHit - Error Caught 158: '+ex);
				}
				return false;
			});

			socket.on('validate', function(jseTrack) {
				try {
					const pubID = JSE.jseFunctions.cleanString(jseTrack.pubID) || 1; // jseTrack.pubID = uid
					const siteID = JSE.jseFunctions.cleanString(jseTrack.siteID) || 1;
					const subID = JSE.jseFunctions.cleanString(jseTrack.subID) || 1;
					if (jseTrack.iFrame && jseTrack.iFrame === true) { return false; }
					const ipCount = JSE.publisherIPs.reduce(function(n, val) { return n + (val === socket.realIP); }, 0); // count ips could be one from unique already
					if (ipCount <= 50  && socket.goodIP && socket.goodIP === true) {
						JSE.publisherIPs.push(socket.realIP);
						jseLottery.credit(pubID,siteID,subID,'validate');
					}
				} catch (ex) {
					console.log('SaveHit - Error Caught 158: '+ex);
				}
				return false;
			});

			socket.on('optInAuthKey', function(jseTrack,optInAuthKey,minerAuthKey,callback) {
				const pubID = JSE.jseFunctions.cleanString(jseTrack.pubID) || 1; // jseTrack.pubID = uid
				const siteID = JSE.jseFunctions.cleanString(jseTrack.siteID) || 1;
				const subID = JSE.jseFunctions.cleanString(jseTrack.subID) || 1;
				if (JSE.jseTestNet) console.log('Received request for miner auth key from '+pubID);
				const testAuthKey = buildOptInAuthKey(jseTrack);
				const ipCount = JSE.publisherIPs.reduce(function(n, val) { return n + (val === socket.realIP); }, 0); // count ips could be one from unique already
				if (typeof JSE.socketConnections[socket.id] !== 'undefined' && JSE.socketConnections[socket.id].goodIP && JSE.socketConnections[socket.id].goodIP === true && ipCount <= 2 && minerAuthKey === JSE.minerAuthKey) {
					JSE.publisherIPs.push(socket.realIP);
					//if (ipCount <= 2) {
					jseLottery.credit(pubID,siteID,subID,'optin');
					//}
					//	else if (ipCount <= 4) {
					//	jseLottery.credit(pubID,siteID,subID,'optinlotteryonly'); // could be removed when we have enough volume
					//}
				}
				let initialRating = -99;
				initialRating = calculateInitialRating(jseTrack);
				// generate new key for new optin click
				if (optInAuthKey === null) {
					if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
						JSE.socketConnections[socket.id].optInAuthKey = testAuthKey;
					}
					callback(testAuthKey,initialRating);
					return false;
				}
				// already opted in
				if (testAuthKey === optInAuthKey) {
					if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
						JSE.socketConnections[socket.id].optInAuthKey = testAuthKey;
					}
					callback(true,initialRating);
				} else {
					if (JSE.jseTestNet) console.log('optInAuthKey validation failed socketio.js 196 UID: '+pubID);
					callback(testAuthKey,initialRating); // set new optInAuthKey? optionally
				}
				return false;
			});

			socket.on('requestFirstPreHash', function(data) { // data 1 = publisher, 2 = self-mining
				socket.emit('firstPreHash', JSE.preHash);
			});

			socket.on('startComs', function(minerType,callback) { // minerType 1 = publisher, 2 = self-mining
				if (typeof callback === "function") {
					if (minerType === 2) {
						if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
							JSE.socketConnections[socket.id].miningType = 2;
						}
						JSE.jseFunctions.realityCheck(socket.realIP, function(goodIPTrue) {
							if (goodIPTrue === true) {
								if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
									JSE.socketConnections[socket.id].goodIP = true;
								}
								callback('goodIP');
							} else {
								if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
									JSE.socketConnections[socket.id].goodIP = false;
								}
								callback('badIP');
							}
						});
					} else if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
						JSE.socketConnections[socket.id].miningType = 1;
						if (JSE.anonymousIPs[socket.realIP] === true) {
							if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
								JSE.socketConnections[socket.id].goodIP = false;
								JSE.vpnData[socket.realIP] = false;
							}
							callback('badIP');
						} else {
							if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
								JSE.socketConnections[socket.id].goodIP = true;
								JSE.vpnData[socket.realIP] = true;
							}
							callback('goodIP');
						}
					} else {
							callback('badIP'); // socket closed
					}
				} else if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					JSE.socketConnections[socket.id].goodIP = false; // possibly using an old script or just not passing callback?
					//JSE.vpnData[socket.realIP] = false;
				}
			});

			socket.on('blockPreHash',function(newPreHash) {
				if (!JSE.authenticatedNode && newPreHash !== JSE.preHash) { // only for new hashes and on unauthenticated nodes
					JSE.preHash = newPreHash; // need to check who sent it in?
					if (JSE.jseTestNet) console.log('Received and distributing new preHash');
					io.emit('blockPreHash', JSE.preHash);
				}
			});

			socket.on('submitHash', function(data) {
				try {
					const hashSplit = data.split(',');
					const subPreHash = JSE.jseFunctions.cleanString(hashSplit[0]);
					const subHash = JSE.jseFunctions.cleanString(hashSplit[1]);
					const subNonce = parseFloat(hashSplit[2]);
					const subUID = parseFloat(hashSplit[3]);
					const subUnique = JSE.jseFunctions.cleanString(hashSplit[4]);
					const subSiteID = JSE.jseFunctions.cleanString(hashSplit[5]);
					const subSubID = JSE.jseFunctions.cleanString(hashSplit[6]);
					const subAppID = JSE.jseFunctions.cleanString(hashSplit[7]) || null;
					const subIP = socket.realIP;
					if (JSE.jseTestNet) console.log('Hash submitted: '+subHash+' from '+subIP);
					if (subHash.substr(0, JSE.jseSettings.difficulty) === '0'.repeat(JSE.jseSettings.difficulty) && subPreHash === JSE.preHash) {
						JSE.jseDataIO.pushVariable('currentHashes',subPreHash+','+subHash+','+subNonce,function(pushRef) {});
					} else if (JSE.jseTestNet) {
						console.log("Error socketio.js 268 hash submitted not matched difficulty or preHash mismatch\n"+subPreHash+"\n"+JSE.preHash);
					}

					if (subSiteID === 'Platform Mining') {
						//if (subUID === 60186) console.log('# JTEST # subIP: '+subIP+' / '+JSE.platformIPs.indexOf(subIP)+' / subUID: ' + subUID+' / '+JSE.platformUIDs.indexOf(subUID)+' / SubUnique: '+subUnique+ ' / '+JSE.platformUniqueIDs.indexOf(subUnique)+' goodIP: '+socket.goodIP);
						JSE.jseDataIO.getVariable('account/'+subUID+'/jseUnique',function(uniqueCheck) {
							if (subHash.substr(0, 4) === '0000' && subPreHash === JSE.preHash && uniqueCheck === subUnique && JSE.platformIPs.indexOf(subIP) === -1 && JSE.platformUIDs.indexOf(subUID) === -1 && JSE.platformUniqueIDs.indexOf(subUnique) === -1  && socket.goodIP && socket.goodIP === true) { // one
								JSE.platformIPs.push(subIP);
								JSE.platformUIDs.push(subUID);
								JSE.platformUniqueIDs.push(subUnique);
								if (subAppID === JSE.credentials.appID) {
									jseLottery.credit(subUID,'Platform Mining',0,'hash');
								} else {
									jseLottery.credit(subUID,'Platform Mining',0,'nolotteryhash');
								}
							} else {
								jseLottery.credit(subUID,'Platform Mining',0,'nolotteryhash');
							}
						});
					} else if (JSE.publisherIPs.indexOf(subIP) === -1 && socket.goodIP && socket.goodIP === true) {
						JSE.publisherIPs.push(subIP);
						jseLottery.credit(subUID,subSiteID,subSubID,'hash');
					} else {
						jseLottery.credit(subUID,subSiteID,subSubID,'nolotteryhash');
					}
				} catch (ex) {
					console.log('Bad hash submitted socketio.js 114: '+ex);
				}
			});

			/** Blockchain Explorer Functions */

			socket.on('getPublicStats', function(callback) {
				if (JSE.authenticatedNode) {
					callback(JSON.stringify(JSE.publicStats));
				} else {
					request('https://load.jsecoin.com/stats/', function (error, response, body) {
						if (error) console.log('getPublicStats download error. modules/socketio.js 482: '+error);
						callback(body);
					});
				}
			});

			socket.on('getDailyStats', function(callback) {
				if (JSE.authenticatedNode) {
					callback(JSON.stringify(JSE.dailyPublicStats));
				} else {
					request('https://load.jsecoin.com/dailystats/', function (error, response, body) {
						if (error) console.log('getPublicStats download error. modules/socketio.js 482: '+error);
						callback(body);
					});
				}
			});

			socket.on('getBlockID', function(callback) {
				callback(JSE.blockID);
			});

			socket.on('getLatestBlocks', function() {
				let myBlockID = parseInt(JSE.blockID,10) - 6;
				while (myBlockID <= parseInt(JSE.blockID,10)) {
					const myBlockRef = JSE.jseDataIO.getBlockRef(myBlockID);
					if (JSE.currentChain[myBlockRef] && JSE.currentChain[myBlockRef][myBlockID]) {
						socket.emit('newBlock', myBlockRef, myBlockID, JSE.currentChain[myBlockRef][myBlockID]);
					}
					myBlockID +=1;
				}
			});

			/**
			 * @function <h2>getTarget</h2>
			 * @description Used to lookup a firebase key of the blockChain i.e. blockChain/123/123456
			 * @param {string} key firebase style key
			 * @returns {object} Returns the value at key
			 */
			function getTarget(key) {
				const keySplit = (key.slice(-1) === '/') ? key.slice(0, -1).split('/') : key.split('/');
				keySplit.shift();
				if (keySplit.length === 1) {
					if (JSE.currentChain[keySplit[0]]) {
						return JSE.currentChain[keySplit[0]];
					}
				} else if (keySplit.length === 2) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]]) { // double check the parents exist to avoid errors, throw a null back if any keys are undefined
						return JSE.currentChain[keySplit[0]][keySplit[1]];
					}
				} else if (keySplit.length === 3) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]]) {
						return JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]];
					}
				} else if (keySplit.length === 4) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]]) {
						return JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]];
					}
				} else if (keySplit.length === 5) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]]) {
						return JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]];
					}
				} else if (keySplit.length === 6) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]]) {
						return JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]];
					}
				} else {
					console.log('ERROR socketio.js 540: Maximum field length reached'); // should never hit this.
				}
				return null;
			}

			socket.on('getChainData', function(fireKey, callback) {
				if (JSE.jseTestNet) console.log('getChainData Request: '+fireKey);
				const chainData = getTarget(fireKey); // getTarget function below
				if (chainData) {
					callback(chainData);
				} else if (fireKey.substr(0,11) === 'blockChain/' && fireKey.length > 12) { // check request is for public blockChain data
					JSE.jseDataIO.getVariable(fireKey,function(chainData2) {
						callback(chainData2);
					});
				} else {
					callback(null);
				}
			});

			socket.on('getLedger', function(callback) {
				if (JSE.jseTestNet) console.log('getLedger Request');
				JSE.jseDataIO.getVariable('ledger/',function(currentLedger) {
					callback(currentLedger);
				});
			});
		}


		let preHashTimer = 0;
		let preHashTimerFirstResult = true;
		/**
		 * @function <h2>sendOutPreHash</h2>
		 * @description Send out preHash and new blocks to miners and peers
		 */
		function sendOutPreHash() {
			preHashTimer += 500;
			if (preHashTimer >= 29000 || preHashTimerFirstResult) {
				JSE.jseDataIO.getVariable('previousBlockPreHash',function(newPreviousBlockPreHash){
					if (newPreviousBlockPreHash !== JSE.preHash) {
						if (JSE.preHash !== '0') preHashTimerFirstResult = false; // change for second result after initial 0 > first preHash
						preHashTimer = 0;
						JSE.preHash = newPreviousBlockPreHash;
						JSE.lockedUIDs = []; // reset lockedUIDs on every block
						if (JSE.jseTestNet) console.log('Connected clients: '+io.engine.clientsCount+' Sending blockPreHash '+JSE.preHash);
						// send blockPreHash to everyone
						io.emit('blockPreHash', JSE.preHash);
						if (Math.random() > 0.9) { // every 5 minutes
							let publisherMinersCount = 0;
							let selfMinersCount = 0;
							Object.keys(JSE.socketConnections).forEach(function(key) {
								if (JSE.socketConnections[key].miningType) {
									if (JSE.socketConnections[key].miningType === 1) publisherMinersCount +=1;
									if (JSE.socketConnections[key].miningType === 2) selfMinersCount +=1;
								}
							});
							const clientStats = {};
							clientStats.publisherMinersCount = publisherMinersCount;
							clientStats.selfMinersCount = selfMinersCount;
							clientStats.updated = new Date().getTime();
							JSE.jseDataIO.setVariable('publicStats/clients/'+JSE.serverNickName,clientStats);
						}
					}
				});
			}
			setTimeout(function() { sendOutPreHash(); }, 500);
		}
		if (JSE.authenticatedNode) sendOutPreHash();

		let block0 = {};
		let blockID0 = 0;
		/**
		 * @function <h2>sendOutSolvedBlocks</h2>
		 * @description Send last solved block to those subscribed
		 */
		function sendOutSolvedBlocks() {
			JSE.jseDataIO.getVariable('blockID',function(newBlockID) {
				JSE.blockID = parseInt(newBlockID,10);
				if (blockID0 !== parseInt(newBlockID,10)) {
					// Block changeover lets spread blocks bid-1 and bid-2
					blockID0 = parseInt(newBlockID,10);
					const targetBlockID = blockID0 - 1;
					JSE.jseDataIO.getBlock(targetBlockID,function(targetBlockObj) {
						const blockRef = JSE.jseDataIO.getBlockRef(targetBlockID);
						if (typeof JSE.currentChain[blockRef] === 'undefined') JSE.currentChain[blockRef] = {};
						JSE.currentChain[blockRef][targetBlockID] = targetBlockObj;
						Object.keys(JSE.socketConnections).forEach(function(sockID) {
							if (JSE.socketConnections[sockID].blockSubscribed) {
								if (JSE.jseTestNet) console.log('Sending block-1 ('+blockRef+'/'+targetBlockID+') after block changeover to '+sockID);
								JSE.socketConnections[sockID].emit('newBlock', blockRef, targetBlockID, targetBlockObj);
							}
						});
					});
					const targetBlockID2 = blockID0 - 2;
					JSE.jseDataIO.getBlock(targetBlockID2,function(targetBlockObj2) {
						const blockRef2 = JSE.jseDataIO.getBlockRef(targetBlockID2);
						if (typeof JSE.currentChain[blockRef2] === 'undefined') JSE.currentChain[blockRef2] = {};
						JSE.currentChain[blockRef2][targetBlockID2] = targetBlockObj2;
						const blockUsersMentioned = [];
						if (targetBlockObj2 && targetBlockObj2.input) {
							Object.keys(targetBlockObj2.input).forEach(function(inputPushRef) {
								if (targetBlockObj2.input[inputPushRef] && targetBlockObj2.input[inputPushRef].user1 && blockUsersMentioned.indexOf(targetBlockObj2.input[inputPushRef].user1) === -1) {
									blockUsersMentioned.push(targetBlockObj2.input[inputPushRef].user1);
								}
								if (targetBlockObj2.input[inputPushRef] && targetBlockObj2.input[inputPushRef].user2 && blockUsersMentioned.indexOf(targetBlockObj2.input[inputPushRef].user2) === -1) {
									blockUsersMentioned.push(targetBlockObj2.input[inputPushRef].user2);
								}
							});
						}
						Object.keys(JSE.socketConnections).forEach(function(sockID) {
							if (JSE.socketConnections[sockID].blockSubscribed) {
								if (JSE.jseTestNet) console.log('Sending block-2 ('+blockRef2+'/'+targetBlockID2+') after block changeover to '+sockID);
								JSE.socketConnections[sockID].emit('newBlock', blockRef2, targetBlockID2, targetBlockObj2);
							}
							if (JSE.socketConnections[sockID].uid) {
								if (blockUsersMentioned.indexOf(JSE.socketConnections[sockID].uid) > -1) {
									JSE.socketConnections[sockID].emit('userUpdate', 'blockUpdate', null);
								}
							}
						});
					});
				}
				JSE.jseDataIO.getBlock(newBlockID,function(newBlockObj) {
					const blockRef3 = JSE.jseDataIO.getBlockRef(newBlockID);
					if (typeof JSE.currentChain[blockRef3] === 'undefined') JSE.currentChain[blockRef3] = {};
					JSE.currentChain[blockRef3][newBlockID] = newBlockObj;
					if (JSE.jseTestNet) console.log('Got block0 from DataIO blockID: '+newBlockID);
					if (newBlockObj !== block0) {
						block0 = newBlockObj;
						Object.keys(JSE.socketConnections).forEach(function(sockID) {
							if (JSE.socketConnections[sockID].blockSubscribed) {
								if (JSE.jseTestNet) console.log('Sending block0 after change ('+blockRef3+'/'+newBlockID+') to '+sockID);
								JSE.socketConnections[sockID].emit('newBlock', blockRef3, newBlockID, newBlockObj);
							}
						});
					}
				});
			});
			setTimeout(function() { sendOutSolvedBlocks(); }, 10000); // 10 seconds
		}
		if (JSE.authenticatedNode) sendOutSolvedBlocks();
		io.on('connection', onConnection);
	},
};

module.exports = jseSocketIO;
