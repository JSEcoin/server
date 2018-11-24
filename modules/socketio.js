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
									1. deviceType,browserType,browserCheck
									2. geo,ipSubnet
									timeZoneMatch,goodReferrer,languageMatch,
									3. screenWidth,screenHeight
									,innerWidth,innerHeight,
									4. deviceMemory,storage
									5. webGLFingerprint
									6. ,movement,timeOnSite,elementsTracked
									,initialRating,variation,sameBrowser,sameIPGeo,sameScreen,sameHardware,sameWebGL,sameInteraction
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
					let sameBrowser = 0;
					let sameIPGeo = 0;
					let sameScreen = 0;
					let sameHardware = 0;
					let sameWebGL = 0;
					let sameInteraction = 0;
					let sameVisitor = -1;
					pubData.forEach((tensor,tensorKey) => {
						if (tensor[4] === visitorTensor[4] && tensor[14] === visitorTensor[14]) sameVisitor = tensorKey; // ipSubnet & webGL Fingerprint
						tensor.forEach((field,fieldKey) => {
							if (visitorTensor[fieldKey] && visitorTensor[fieldKey] === field) {
								duplicateFieldCount += 1;
							}
						});
						if (tensor[0] === visitorTensor[0] && tensor[1] === visitorTensor[1] && tensor[2] === visitorTensor[2]) sameBrowser += 1;
						if (tensor[3] === visitorTensor[3] && tensor[4] === visitorTensor[4]) sameIPGeo += 1;
						if (tensor[8] === visitorTensor[8] && tensor[9] === visitorTensor[9]) sameScreen += 1;
						if (tensor[12] === visitorTensor[12] && tensor[13] === visitorTensor[13]) sameHardware += 1;
						if (tensor[14] === visitorTensor[14]) sameWebGL += 1;
						if (tensor[15] === visitorTensor[15] && tensor[16] === visitorTensor[16] && tensor[17] === visitorTensor[17]) sameInteraction += 1;
					});
					const dupeTotal = Math.round(duplicateFieldCount / (pubData.length || 0));
					visitorTensor.push(dupeTotal || 0);
					visitorTensor.push(sameBrowser);
					visitorTensor.push(sameIPGeo);
					visitorTensor.push(sameScreen);
					visitorTensor.push(sameHardware);
					visitorTensor.push(sameWebGL);
					visitorTensor.push(sameInteraction);
					if (sameVisitor === -1) {
						pubData.unshift(visitorTensor);
					} else {
						pubData[sameVisitor] = visitorTensor;
					}
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
				if (userAgentLC.indexOf('firefox') > -1) {
					browserType = 1;
				} else if (userAgentLC.indexOf('opera') > -1) {
					browserType = 2;
				} else if (userAgentLC.indexOf('chrome') > -1)	{ // chrome needs to go above safari because useragent contains safari as well
					browserType = 3;
				} else if (userAgentLC.indexOf('safari') > -1) {
					browserType = 4;
				} else if (userAgentLC.indexOf('edge') > -1) {
					browserType = 5;
				} else if (userAgentLC.indexOf('msie') > -1) {
					browserType = 6;
				} else if (userAgentLC.indexOf('ucbrowser') > -1) {
					browserType = 7;
				} else if (userAgentLC.indexOf('android') > -1) {
					browserType = 8;
				} else if (userAgentLC.indexOf('fban') > -1) { // facebook app
					browserType = 9;
				}
				visitorTensor.push(browserType);

				let browserCheck = 0;
				if (jseTrack.browserCheck) {
					initialRating += 10;
					browserCheck = 1;
				} else {
					initialRating -= 10;
				}
				visitorTensor.push(browserCheck);

				const geo = jseTrack.geo || 'XX';
				const numericGEO = Number(geo.charCodeAt(0)+''+geo.charCodeAt(1));
				visitorTensor.push(numericGEO);

				let numericSubnet = 0;
				const ipSplit = jseTrack.userIP.split('.');
				if (ipSplit[1]) {
					numericSubnet = Number(ipSplit[0]+''+ipSplit[1]);
				}
				visitorTensor.push(numericSubnet);

				// Check Timezone Offset Matches GEO
				const timezoneOffset = jseTrack.timezoneOffset || 0;
				const timeZones = [["AF",270],["AX",120],["AL",60],["DZ",60],["AS",-660],["AD",60],["AO",60],["AI",-240],["AQ",480],["AQ",420],["AQ",600],["AQ",300],["AQ",780],["AQ",-180],["AQ",180],["AQ",360],["AG",-240],["AR",-180],["AM",240],["AW",-240],["AU",660],["AU",630],["AU",600],["AU",570],["AU",507],["AU",480],["AT",60],["AZ",240],["BS",-300],["BH",180],["BD",360],["BB",-240],["BY",180],["BE",60],["BZ",-360],["BJ",60],["BM",-240],["BT",360],["BO",-240],["BQ",-240],["BA",60],["BW",120],["BR",-180],["BR",-240],["BR",-300],["BR",-120],["IO",360],["VG",-240],["BN",480],["BG",120],["BI",120],["KH",420],["CM",60],["CA",-300],["CA",-240],["CA",-420],["CA",-480],["CA",-360],["CA",-210],["CV",-60],["KY",-300],["CF",60],["TD",60],["CL",-180],["CL",-300],["CN",480],["CN",360],["CX",420],["CC",390],["CO",-300],["KM",180],["CK",-600],["CR",-360],["HR",60],["CU",-300],["CW",-240],["CY",120],["CZ",60],["CD",60],["CD",120],["DK",60],["DJ",180],["DM",-240],["DO",-240],["TL",540],["EC",-300],["EC",-360],["EG",120],["SV",-360],["GQ",60],["ER",180],["EE",120],["ET",180],["FK",-180],["FO",0],["FJ",780],["FI",120],["FR",60],["GF",-180],["PF",-540],["PF",-570],["PF",-600],["TF",300],["GA",60],["GM",0],["GE",240],["DE",60],["GH",0],["GI",60],["GR",120],["GL",0],["GL",-180],["GL",-60],["GL",-240],["GD",-240],["GP",-240],["GU",600],["GT",-360],["GG",0],["GN",0],["GW",0],["GY",-240],["HT",-300],["HN",-360],["HK",480],["HU",60],["IS",0],["IN",330],["ID",420],["ID",540],["ID",480],["IR",210],["IQ",180],["IE",0],["IM",0],["IL",120],["IT",60],["CI",0],["JM",-300],["JP",540],["JE",0],["JO",120],["KZ",360],["KZ",300],["KE",180],["KI",780],["KI",840],["KI",720],["KW",180],["KG",360],["LA",420],["LV",120],["LB",120],["LS",120],["LR",0],["LY",120],["LI",60],["LT",120],["LU",60],["MO",480],["MK",60],["MG",180],["MW",120],["MY",480],["MV",300],["ML",0],["MT",60],["MH",720],["MQ",-240],["MR",0],["MU",240],["YT",180],["MX",-360],["MX",-300],["MX",-420],["MX",-480],["FM",600],["FM",660],["MD",120],["MC",60],["MN",480],["MN",420],["ME",60],["MS",-240],["MA",60],["MZ",120],["MM",390],["NA",120],["NR",720],["NP",327],["NL",60],["NC",660],["NZ",780],["NZ",807],["NI",-360],["NE",60],["NG",60],["NU",-660],["NF",660],["KP",540],["MP",600],["NO",60],["OM",240],["PK",300],["PW",540],["PS",120],["PA",-300],["PG",660],["PG",600],["PY",-180],["PE",-300],["PH",480],["PN",-480],["PL",60],["PT",-60],["PT",0],["PR",-240],["QA",180],["CG",60],["RE",240],["RO",120],["RU",720],["RU",420],["RU",540],["RU",480],["RU",660],["RU",360],["RU",600],["RU",300],["RU",240],["RU",120],["RU",180],["RW",120],["BL",-240],["SH",0],["KN",-240],["LC",-240],["MF",-240],["PM",-180],["VC",-240],["WS",840],["SM",60],["ST",60],["SA",180],["SN",0],["RS",60],["SC",240],["SL",0],["SG",480],["SX",-240],["SK",60],["SI",60],["SB",660],["SO",180],["ZA",120],["GS",-120],["KR",540],["SS",180],["ES",60],["ES",0],["LK",330],["SD",120],["SR",-180],["SJ",60],["SZ",120],["SE",60],["CH",60],["SY",120],["TW",480],["TJ",300],["TZ",180],["TH",420],["TG",0],["TK",780],["TO",780],["TT",-240],["TN",60],["TR",180],["TM",300],["TC",-300],["TV",720],["VI",-240],["UG",180],["UA",120],["AE",240],["GB",60],["GB",0],["US",-600],["US",-540],["US",-420],["US",-360],["US",-300],["US",-480],["UM",-660],["UM",720],["UY",-180],["UZ",300],["VU",660],["VA",60],["VE",-240],["VN",420],["WF",720],["EH",60],["YE",180],["ZM",120],["ZW",120]];
				let timeZoneMatch = 0;
        for (let i = 0; i < timeZones.length; i+=1) {
          if (geo === timeZones[i][0]) {
            if (parseInt(timezoneOffset,10) === timeZones[i][1]) {
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
				visitorTensor.push(jseTrack.screenWidth || 0);
				visitorTensor.push(jseTrack.screenHeight || 0);
				visitorTensor.push(jseTrack.innerWidth || 0);
				visitorTensor.push(jseTrack.innerHeight || 0);
        if (jseTrack.deviceMemory > 2) {
          initialRating += 5;
				}
				visitorTensor.push(jseTrack.deviceMemory);

        if (jseTrack.storage && parseInt(jseTrack.storage,10) === jseTrack.storage) {
					visitorTensor.push(jseTrack.storage || 0);
					if (jseTrack.storage > 10) {
						initialRating += 10;
					} else {
						initialRating += jseTrack.storage;
					}
				} else {
					visitorTensor.push(0);
				}
				visitorTensor.push(jseTrack.webGL);

				visitorTensor.push(jseTrack.movement || 0);
				visitorTensor.push(jseTrack.timeOnSite || 0);
				visitorTensor.push(jseTrack.elementsTracked || 0);
				visitorTensor.push(initialRating);

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
					console.log('SaveUnique - Error Caught 381: '+ex);
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
					if (socket.goodIP && socket.goodIP === true) {
						if (ipCount <= 8 || (ipCount <= 35  && JSE.publisherIPsValidated.indexOf(socket.realIP) === -1)) { // Change to 5 & 20 as volume increases
							JSE.publisherIPs.push(socket.realIP);
							JSE.publisherIPsValidated.push(socket.realIP);
							const currentRating = calculateInitialRating(jseTrack);
							jseLottery.credit(pubID,siteID,subID,'validate');
						}
					}
				} catch (ex) {
					console.log('Validate - Error Caught 399: '+ex);
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
