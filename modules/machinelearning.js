/**
 * @module jseMachineLearning
 * @description Machine learning and data aggregation modules
 * <h5>Exported</h5>
 * <ul>
 * <li></li>
 * </ul>
 */

const JSE = global.JSE;

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

let referralModel;
async function loadReferralModel() {
	referralModel = await tf.loadModel('file://./misc/referralmodel.json','file://./misc/referralweights.bin');
}
loadReferralModel();


const jseMachineLearning = {
	/**
	 * @method <h2>recordPublisherMLData</h2>
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
	recordPublisherMLData(rawPubID,visitorTensor) {
		const pubID = parseInt(rawPubID,10);
		if (rawPubID != pubID || !pubID > 0) return false; // eslint-disable-line
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
			const sameBrowserTotal = Math.round(sameBrowser / (pubData.length || 0),2);
			visitorTensor.push(sameBrowserTotal);
			const sameIPGeoTotal = Math.round(sameIPGeo / (pubData.length || 0),2);
			visitorTensor.push(sameIPGeoTotal);
			const sameScreenTotal = Math.round(sameScreen / (pubData.length || 0),2);
			visitorTensor.push(sameScreenTotal);
			const sameHardwareTotal = Math.round(sameHardware / (pubData.length || 0),2);
			visitorTensor.push(sameHardwareTotal);
			const sameWebGLTotal = Math.round(sameWebGL / (pubData.length || 0),2);
			visitorTensor.push(sameWebGLTotal);
			const sameInteractionTotal = Math.round(sameInteraction / (pubData.length || 0),2);
			visitorTensor.push(sameInteractionTotal);
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
	},

		/**
	 * @method <h2>recordReferralMLData</h2>
	 * @description Record referrals in a tensor ready for machine learning
						1. deviceType,browserType,browserCheck
						2. geo,ipSubnet
						timeZoneMatch,goodReferrer,languageMatch,
						3. screenWidth,screenHeight
						,innerWidth,innerHeight,
						4. deviceMemory,storage
						5. webGLFingerprint
						6. ,movement,timeOnSite,elementsTracked
						,initialRating = visitorTensor[18]
						[nameLength, addressQuality, geoMatch, languageMatch, screenWidth, screenHeight, emailNumbers, emailLetters, emailOthers, numericEmailDomain, numericEmailTLD, duplicate, dadEmailNumbers, dadEmailLetters, dadEmailOther, dadNumericEmailDomain, dadNumericEmailTLD, dadDupe, grandadSuspended, grandadDupe]
						variation,sameBrowser,sameIPGeo,sameScreen,sameHardware,sameWebGL,sameInteraction
	* @param {array} visitorTensor Two diemnsional array created in calculateInitialRating function
	*/
	recordReferralMLData(rawAffID,visitorTensor) {
		const affID = parseInt(rawAffID,10);
		if (rawAffID != affID || !affID > 0) return false; // eslint-disable-line
		JSE.jseDataIO.getVariable('publisherMLData/'+affID,function(affMLData) {
			let affData = affMLData;
			if (!affData) {
				affData = [];
			}
			let duplicateFieldCount = 0;
			let sameBrowser = 0;
			let sameIPGeo = 0;
			let sameScreen = 0;
			let sameHardware = 0;
			let sameWebGL = 0;
			let sameInteraction = 0;
			let similarEmailUser = 0;
			let sameEmailDomain = 0;

			affData.forEach((tensor,tensorKey) => {
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
				if (tensor[25] === visitorTensor[25]) similarEmailUser += 1;
				if (tensor[26] === visitorTensor[26]) similarEmailUser += 1;
				if (tensor[27] === visitorTensor[27]) similarEmailUser += 1;
				if (tensor[28] === visitorTensor[28]) sameEmailDomain += 1;
			});
			const dupeTotal = Math.round(duplicateFieldCount / (affData.length || 0),2);
			visitorTensor.push(dupeTotal || 0);
			const sameBrowserTotal = Math.round(sameBrowser / (affData.length || 0),2);
			visitorTensor.push(sameBrowserTotal);
			const sameIPGeoTotal = Math.round(sameIPGeo / (affData.length || 0),2);
			visitorTensor.push(sameIPGeoTotal);
			const sameScreenTotal = Math.round(sameScreen / (affData.length || 0),2);
			visitorTensor.push(sameScreenTotal);
			const sameHardwareTotal = Math.round(sameHardware / (affData.length || 0),2);
			visitorTensor.push(sameHardwareTotal);
			const sameWebGLTotal = Math.round(sameWebGL / (affData.length || 0),2);
			visitorTensor.push(sameWebGLTotal);
			const sameInteractionTotal = Math.round(sameInteraction / (affData.length || 0),2);
			visitorTensor.push(sameInteractionTotal);
			const similarEmailUserTotal = Math.round(similarEmailUser / (affData.length || 0),2);
			visitorTensor.push(similarEmailUserTotal);
			const sameEmailDomainTotal = Math.round(sameEmailDomain / (affData.length || 0),2);
			visitorTensor.push(sameEmailDomainTotal);

			affData.unshift(visitorTensor);
			JSE.jseDataIO.setVariable('referralMLData/'+affID,affData);
		});
		return false;
	},

	/**
	 * @method <h2>calculateInitialRating</h2>
	 * @description Calculate an initial rating of client quality and format data for TensorFlow
	 * @param {object} jseTrack browser data object
	 * @returns {int} initial rating -99 to +99
	 */
	calculateInitialRating(jseTrack) {
		let initialRating = 0;
		//const pubID = parseInt(JSE.jseFunctions.cleanString(jseTrack.pubID) || 1,10);

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
		let numericGeo = 0;
		if (geo === 'US') numericGeo = 60;
		if (geo === 'CA') numericGeo = 59;
		if (geo === 'GB') numericGeo = 58;
		if (geo === 'AU') numericGeo = 57;
		if (geo === 'NZ') numericGeo = 56;
		if (geo === 'DE') numericGeo = 55;
		if (geo === 'IE') numericGeo = 54;
		if (geo === 'SG') numericGeo = 53;
		if (geo === 'HK') numericGeo = 52;
		if (geo === 'CH') numericGeo = 51;
		if (geo === 'NO') numericGeo = 50;
		if (geo === 'FR') numericGeo = 49;
		if (geo === 'JP') numericGeo = 48;
		if (geo === 'KR') numericGeo = 47;
		if (geo === 'CZ') numericGeo = 46;
		if (geo === 'IT') numericGeo = 45;
		if (geo === 'ES') numericGeo = 44;
		if (geo === 'LT') numericGeo = 43;
		if (geo === 'FI') numericGeo = 42;
		if (geo === 'AT') numericGeo = 41;
		if (geo === 'BE') numericGeo = 40;
		if (geo === 'IL') numericGeo = 39;
		if (geo === 'DK') numericGeo = 38;
		if (geo === 'SK') numericGeo = 37;
		if (geo === 'SI') numericGeo = 36;
		if (geo === 'TW') numericGeo = 35;
		if (geo === 'PT') numericGeo = 34;
		if (geo === 'PL') numericGeo = 33;
		if (geo === 'BR') numericGeo = 32;
		if (geo === 'BG') numericGeo = 31;
		if (geo === 'RO') numericGeo = 30;
		if (geo === 'TH') numericGeo = 29;
		if (geo === 'MY') numericGeo = 28;
		if (geo === 'HU') numericGeo = 27;
		if (geo === 'ZA') numericGeo = 26;
		if (geo === 'TR') numericGeo = 25;
		if (geo === 'GR') numericGeo = 24;
		if (geo === 'CO') numericGeo = 23;
		if (geo === 'PE') numericGeo = 22;
		if (geo === 'VE') numericGeo = 21;
		if (geo === 'MX') numericGeo = 20;
		if (geo === 'AR') numericGeo = 19;
		if (geo === 'LV') numericGeo = 18;
		if (geo === 'PH') numericGeo = 17;
		if (geo === 'IN') numericGeo = 16;
		if (geo === 'PK') numericGeo = 15;
		if (geo === 'ET') numericGeo = 14;
		if (geo === 'VN') numericGeo = 13;
		if (geo === 'NL') numericGeo = 12;
		if (geo === 'SE') numericGeo = 11;
		if (geo === 'NG') numericGeo = 10;
		if (geo === 'CN') numericGeo = 9;
		if (geo === 'RU') numericGeo = 8;
		if (geo === 'UA') numericGeo = 7;
		if (geo === 'ID') numericGeo = 6;
		if (geo === 'XX') numericGeo = 5;
		if (geo === 'A1') numericGeo = 4;
		if (geo === 'A2') numericGeo = 3;
		if (geo === 'SPARE') numericGeo = 2;
		if (geo === 'SPARE') numericGeo = 1;
		//const numericGeo = Number(geo.charCodeAt(0)+''+geo.charCodeAt(1));
		visitorTensor.push(numericGeo);

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
		if (jseTrack.referrer && (String(jseTrack.referrer).indexOf('.com') > -1 || (jseTrack.siteID && jseTrack.siteID.indexOf('.com')))) initialRating += 5;
		if (jseTrack.referrer && (String(jseTrack.referrer).indexOf('.edu') > -1 || (jseTrack.siteID && jseTrack.siteID.indexOf('.edu')))) initialRating += 5;
		if (jseTrack.referrer && (String(jseTrack.referrer).indexOf('.org') > -1 || (jseTrack.siteID && jseTrack.siteID.indexOf('.org')))) initialRating += 2;
		if (jseTrack.referrer && (String(jseTrack.referrer).indexOf('.org') > -1 || (jseTrack.siteID && jseTrack.siteID.indexOf('.org')))) initialRating += 2;
		let goodReferrer = 0;
		if (jseTrack.referrer && /(google.com|facebook.com|youtube.com|twitter.com|microsoft.com|linkedin.com|instagram.com|wikipedia.org|plus.google.com|apple.com|adobe.com|wikipedia.org|apple.com|vimeo.com|pinterest.com|yahoo.com|amazon.com|github.com|nytimes.com|reddit.com|bbc.co.uk|cnn.com|theguardian.com|forbes.com|msn.com|bing.com|imdb.com|slideshare.net|reuters.com|live.com|medium.com|bloomberg.com|mit.edu|stanford.edu|harvard.edu)/.test(jseTrack.referrer)) {
			initialRating += 10;
			goodReferrer = 1;
		}
		visitorTensor.push(goodReferrer);
		let languageMatch = 0;
		if (jseTrack.language && String(jseTrack.language).indexOf(jseTrack.geo) > -1) {
			initialRating += 5;
			languageMatch = 1;
		}
		visitorTensor.push(languageMatch);
		if (jseTrack.innerWidth > 250 && jseTrack.innerHeight > 250 && jseTrack.screenDepth > 16 && jseTrack.innerWidth < jseTrack.screenWidth && jseTrack.innerHeight < jseTrack.screenHeight) {
			initialRating += 5;
		}
		visitorTensor.push(jseTrack.screenWidth || 0);
		visitorTensor.push(parseInt(jseTrack.screenHeight,10) || 0);
		visitorTensor.push(parseInt(jseTrack.innerWidth,10) || 0);
		visitorTensor.push(parseInt(jseTrack.innerHeight,10) || 0);
		if (jseTrack.deviceMemory > 2) {
			initialRating += 5;
		}
		visitorTensor.push(parseInt(jseTrack.deviceMemory,10));

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
		visitorTensor.push(parseInt(jseTrack.webGL,10));

		visitorTensor.push(parseInt(jseTrack.movement,10) || 0);
		visitorTensor.push(parseInt(jseTrack.timeOnSite,10) || 0);
		visitorTensor.push(parseInt(jseTrack.elementsTracked,10) || 0);
		visitorTensor.push(initialRating);

		//recordMLData(pubID,visitorTensor);
		return visitorTensor;
	},

	/**
	 * @method <h2>referralCheck</h2>
	 * @description Run tensorflow machine learning model against new user data to get a risk score for the referral
	 * [nameLength, addressQuality, geoMatch, languageMatch, screenWidth, screenHeight, duplicate, dadEmailNumbers, dadEmailLetters, dadEmailOther, dadNumericEmailDomain, dadNumericEmailTLD, dadDupe, grandadSuspended, grandadDupe]
	 */
	referralCheck: async (account,payout,jseTrack) => {
		let userTensor = [];
		const affID = account.campaign.split(/[^0-9]/).join('');

		userTensor.push(account.name.length);
		let addressQuality = 0;
		if (/[0-9]/.test(account.address)) addressQuality += 1;
		if (/\s/.test(account.address)) addressQuality += 1;
		if (/[a-z]/.test(account.address)) addressQuality += 1;
		if (/[A-Z]/.test(account.address)) addressQuality += 1;
		userTensor.push(addressQuality);
		const numericCountry = Number(account.country.charCodeAt(0)+''+account.country.charCodeAt(1));
		//userTensor.push(numericCountry);
		const numericGeo = Number(account.geo.charCodeAt(0)+''+account.geo.charCodeAt(1));
		//userTensor.push(numericGeo);
		let geoMatch = 0;
		if (numericCountry === numericGeo) geoMatch = 1;
		userTensor.push(geoMatch);
		let languageMatch = 0;
		if (account.language && String(account.language).indexOf(account.geo) > -1) {
			languageMatch = 1;
		}
		userTensor.push(languageMatch);
		let screenWidth = 0;
		let screenHeight = 0;
		if (account.screen) {
			const screenSplit = account.screen.split('x');
			screenWidth = parseInt(screenSplit[0],10) || 0;
			screenHeight = parseInt(screenSplit[1],10) || 0;
		}
		userTensor.push(screenWidth);
		userTensor.push(screenHeight);

		function getEmailData(email) {
			const emailOutputArray = [];
			const emailUsername = email.split('@')[0];
			const emailNumbers = emailUsername.split(/[^0-9]/).join('').length;
			emailOutputArray.push(emailNumbers);
			const emailLetters = emailUsername.split(/[^A-Za-z]/).join('').length;
			emailOutputArray.push(emailLetters);
			const emailOthers = emailUsername.length - emailNumbers - emailLetters;
			emailOutputArray.push(emailOthers);
			const emailDomain = email.split('@')[1];
			let numericEmailDomain = 0;
			if (emailDomain.indexOf('gmail') > -1) numericEmailDomain = 25;
			else if (emailDomain.indexOf('googlemail') > -1) numericEmailDomain = 24;
			else if (emailDomain.indexOf('hotmail') > -1) numericEmailDomain = 23;
			else if (emailDomain.indexOf('outlook') > -1) numericEmailDomain = 22;
			else if (emailDomain.indexOf('live.com') > -1) numericEmailDomain = 21;
			else if (emailDomain.indexOf('yahoo') > -1) numericEmailDomain = 20;
			else if (emailDomain.indexOf('ymail') > -1) numericEmailDomain = 19;
			else if (emailDomain.indexOf('mail.ru') > -1) numericEmailDomain = 18;
			else if (emailDomain.indexOf('yandex.ru') > -1) numericEmailDomain = 17;
			else if (emailDomain.indexOf('outlook') > -1) numericEmailDomain = 16;
			else if (emailDomain.indexOf('rambler') > -1) numericEmailDomain = 15;
			else if (emailDomain.indexOf('comcast') > -1) numericEmailDomain = 14;
			else if (emailDomain.indexOf('cloud') > -1) numericEmailDomain = 13;
			else if (emailDomain.indexOf('zoho') > -1) numericEmailDomain = 12;
			else if (emailDomain.indexOf('bk.ru') > -1) numericEmailDomain = 11;
			else if (emailDomain.indexOf('ukr.net') > -1) numericEmailDomain = 10;
			else if (emailDomain.indexOf('inbox') > -1) numericEmailDomain = 9;
			else if (emailDomain.indexOf('icloud') > -1) numericEmailDomain = 8;
			else if (emailDomain.indexOf('protonmail') > -1) numericEmailDomain = 7;
			else if (emailDomain.indexOf('wanadoo') > -1) numericEmailDomain = 6;
			else if (emailDomain.indexOf('orange') > -1) numericEmailDomain = 5;
			else if (emailDomain.indexOf('gmx') > -1) numericEmailDomain = 4;
			else if (emailDomain.indexOf('libero') > -1) numericEmailDomain = 3;
			else if (emailDomain.indexOf('freenet') > -1) numericEmailDomain = 2;
			else if (emailDomain.indexOf('rocket') > -1) { numericEmailDomain = 1; }
			emailOutputArray.push(numericEmailDomain);
			let numericEmailTLD = 0;
			if (emailDomain.indexOf('.com') > -1) numericEmailTLD = 20;
			else if (emailDomain.indexOf('.gov') > -1) numericEmailTLD = 19;
			else if (emailDomain.indexOf('.org') > -1) numericEmailTLD = 18;
			else if (emailDomain.indexOf('.net') > -1) numericEmailTLD = 17;
			else if (emailDomain.indexOf('.io') > -1) numericEmailTLD = 16;
			else if (emailDomain.indexOf('.de') > -1) numericEmailTLD = 15;
			else if (emailDomain.indexOf('.uk') > -1) numericEmailTLD = 14;
			else if (emailDomain.indexOf('.it') > -1) numericEmailTLD = 13;
			else if (emailDomain.indexOf('.fr') > -1) numericEmailTLD = 12;
			else if (emailDomain.indexOf('.be') > -1) numericEmailTLD = 11;
			else if (emailDomain.indexOf('.br') > -1) numericEmailTLD = 10;
			else if (emailDomain.indexOf('.id') > -1) numericEmailTLD = 9;
			else if (emailDomain.indexOf('.nl') > -1) numericEmailTLD = 8;
			else if (emailDomain.indexOf('.jp') > -1) numericEmailTLD = 7;
			else if (emailDomain.indexOf('.ru') > -1) numericEmailTLD = 6;
			else if (emailDomain.indexOf('.ua') > -1) numericEmailTLD = 5;
			else if (emailDomain.indexOf('.ar') > -1) numericEmailTLD = 4;
			else if (emailDomain.indexOf('.mx') > -1) numericEmailTLD = 3;
			else if (emailDomain.indexOf('.sg') > -1) numericEmailTLD = 2;
			else if (emailDomain.indexOf('.ca') > -1) { numericEmailTLD = 1; }
			emailOutputArray.push(numericEmailTLD);
			// emailNumbers, emailLetters, emailOther, numericEmailDomain, numericEmailTLD
			return emailOutputArray;
		}

		const emailData = getEmailData(account.email);
		userTensor = userTensor.concat(emailData);

		let dupe = 0;
		if (account.duplicate) {
			dupe = 1;
		}
		userTensor.push(dupe);

		let dadEmailNumbers = 0;
		let dadEmailLetters = 0;
		let dadEmailOther = 0;
		let dadNumericEmailDomain = 0;
		let dadNumericEmailTLD = 0;
		let dadDupe = 0;
		let grandadSuspended = 0;
		let grandadDupe = 0;
		if (account.campaign && account.campaign.indexOf('aff') > -1) {
			const dadUID = account.campaign.split(/[^0-9]/).join(''); // same as affID
			const dad = await JSE.jseDataIO.asyncGetVar('account/'+dadUID);
			if (dad && dad.email) {
				const dadEmailData = getEmailData(dad.email);
				if (emailData[0] === dadEmailData[0]) dadEmailNumbers = 1;
				if (emailData[1] === dadEmailData[1]) dadEmailLetters = 1;
				if (emailData[2] === dadEmailData[2]) dadEmailOther = 1;
				if (emailData[3] === dadEmailData[3]) dadNumericEmailDomain = 1;
				if (emailData[4] === dadEmailData[4]) dadNumericEmailTLD = 1;
				if (dad.duplicate) dadDupe = 1;
				if (dad.campaign && dad.campaign.indexOf('aff') > -1) {
					const grandadUID = account.campaign.split(/[^0-9]/).join('');
					const grandad = await JSE.jseDataIO.asyncGetVar('account/'+grandadUID);
					if (grandad.suspended) grandadSuspended = 1;
					if (grandad.duplicate) grandadDupe = 1;
				}
			}
		}
		userTensor.push(dadEmailNumbers);
		userTensor.push(dadEmailLetters);
		userTensor.push(dadEmailOther);
		userTensor.push(dadNumericEmailDomain);
		userTensor.push(dadNumericEmailTLD);
		userTensor.push(dadDupe);
		userTensor.push(grandadSuspended);
		userTensor.push(grandadDupe);

		const res1 = referralModel.predict(tf.tensor2d(userTensor,[1,userTensor.length])); // low value just below 0.5
		const res1Sync = res1.dataSync();
		const res1Data = res1Sync[0];
		if (res1Data <= 0.3) {
			console.log('ML: Referral fraud rating:'+res1Data.toFixed(2)+' '+account.campaign);
			JSE.jseFunctions.referral(account.campaign,account.content,0,account.geo,'Declined Risk Score');
		} else {
			console.log('ML: Referral approved rating:'+res1Data.toFixed(2)+' '+account.campaign);
			JSE.jseFunctions.referral(account.campaign,account.content,payout,account.geo,'Confirmed');
		}
		let affTensor = jseMachineLearning.calculateInitialRating(jseTrack);
		affTensor = affTensor.concat(userTensor); // initial rating + userTensor

		jseMachineLearning.recordReferralMLData(affID,affTensor);
	},

	/**
	 * @method <h2>testCaptcha</h2>
	 * @description Requires tensorflow module once we have enough data
	 */
	testCaptcha: async (ip,c) => {
		let rating = 0;
		if (c.tickTime < c.loadTime - 3000) rating += 5;
		if (c.finishTime < c.tickTime - 5000) rating += 5;
		if (c.tickTime > c.loadTime - 1000) rating -= 10;
		if (c.mouseUp > 20) rating += 5;
		if (c.mouseDown > 20) rating += 5;
		if (c.mouseLeft > 20) rating += 5;
		if (c.mouseRight > 20) rating += 5;
		if (c.mouseClicks >= 5 && c.mouseClicks < 100) {
			rating += 20;
		} else if (c.mouseClicks >= 1) {
			rating += 5;
		} else {
			rating -= 10;
		}
		let mousePatternTest = 0;
		let mouseX = 0;
		let mouseY = 0;
		const botRegEx = new RegExp("(googlebot|Googlebot-Mobile|Googlebot-Image|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|headless|puppeteer|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|tagoobot|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|AddThis)", 'i');
		const mobileRegEx = new RegExp("(Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune)", 'i');
		const desktopRegEx = new RegExp("(Win64|CrOS|Mac( ||-)OS( ||-)X|WOW64|Windows NT)", 'i');
		if (botRegEx.test(c.userAgent)) {
			rating -= 10;
		} else if (mobileRegEx.test(c.userAgent)) {
			rating += 20;
		} else if (desktopRegEx.test(c.userAgent)) {
			rating += 5;
		}
		const browserRegEx = new RegExp("(firefox|opera|chrome|safari|edge|msie|ucbrowser|android|fban)", 'i');
		if (browserRegEx.test(c.userAgent)) rating += 10;
		if (c.referrer && (String(c.referrer).indexOf('.com') > -1)) rating += 5;
		c.mousePattern.forEach((mouseMove) => {
			const mX = mouseMove.split('x')[0];
			const mY = mouseMove.split('x')[1];
			if (mX > mouseX -5 && mX < mouseX +5 && mY > mouseY -5 && mY < mouseY +5) {
				mousePatternTest += 1;
			} else {
				mousePatternTest -= 1;
			}
			mouseX = mX;
			mouseY = mY;
		});
		if (c.checkBox && c.checkBox === 1) rating -= 90;
		if (mousePatternTest > 20) {
			rating += 30;
		} else if (mousePatternTest > 0) {
			rating += 10;
		}
		if (c.screenWidth > 300 && c.screenHeight > 600 && c.innerWidth <= c.screenWidth && c.innerHeight <= c.screenHeight) {
			rating += 10;
		} else {
			rating -= 10;
		}
		const ipLookup = async () => {
			return new Promise(resolve => {
				JSE.jseFunctions.realityCheck(ip,(ipCheck) => {
					resolve(ipCheck);
				});
			});
		};
		//console.log(ipLookup);
		if (ipLookup) {
			rating += 30;
		} else {
			rating -= 20;
		}
		const finalRating = Math.min(100,Math.max(0,rating));
		return finalRating;
	},
};

module.exports = jseMachineLearning;
