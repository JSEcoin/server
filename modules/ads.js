/**
 * @module jseAds
 * @description Functions for the ad exchange
 * <h5>Exported</h5>
 * <ul>
 * <li>requestCode</li>
 * </ul>
 */

const JSE = global.JSE;

const jseAds = {
	/**
	 * @method <h2>getAdOptions</h2>
	 * @description find matching ads for an ad request
	 * @returns {string} javascript code to inject on to page
	 */
	getAdOptions: async(adRequest) => {
		const adOptions = {};
		adOptions['728x90'] = [];
		adOptions['300x100'] = [];
		adOptions['300x250'] = [];
		adOptions.inText = [];
		// category selection
		let category = parseInt(adRequest.category,10);
		if (JSE.adxCategories[adRequest.domain]) {
			category = parseInt(JSE.adxCategories[adRequest.domain],10);
		}
		if (typeof adRequest.manualCategory !== 'undefined') {
			category = parseInt(adRequest.manualCategory,10);
		}
		if (!JSE.adxActiveCampaigns) return false;
		JSE.adxActiveCampaigns.forEach((campaign) => {
			if (!campaign.active[adRequest.geo]) return;
			if (!campaign.devices && !campaign[adRequest.device]) return;
			if (!campaign.browsers && !campaign[adRequest.browser]) return;
			if (!campaign.category) {
				if (category === 0 && !campaign.general) return;
				if (category === 1 && !campaign.crypto) return;
				if (category === 2 && !campaign.streaming) return;
				if (category === 3 && !campaign.adult) return;
			}
			if (campaign.domainBlacklist.indexOf(adRequest.domain) > -1) return;
			if (campaign.domainWhitelist.indexOf('.') > -1 && campaign.domainWhitelist.indexOf(adRequest.domain) === -1) return;
			if (campaign.publisherBlacklist.indexOf(adRequest.pubID) > -1) return;
			if (campaign.publisherWhitelist.length > 1 && campaign.publisherWhitelist.indexOf(adRequest.pubID) === -1) return;
			if (adRequest.blockedAdvertisers.indexOf(campaign.uid) > -1) return;
			if (!adRequest.blockedAutoBanners) {
				campaign.banners.forEach((banner) => {
					if (banner.size === '300x100' || banner.size === '728x90') {
						const adOption = {};
						adOption.fileName = banner.fileName;
						adOption.size = banner.size;
						adOption.url = campaign.url;
						adOption.cid = campaign.cid;
						adOption.bidPrice = campaign.active.bidPrice;
						adOption.advID = campaign.uid;
						adOption.device = adRequest.device;
						adOption.browser = adRequest.browser;
						adOption.domain = adRequest.domain;
						adOption.geo = adRequest.geo;
						adOption.pubID = adRequest.pubID;
						adOption.siteID = adRequest.siteID;
						adOption.subID = adRequest.subID;
						adOptions[banner.size].push(adOption);
					}
					if (banner.size === '300x250') {
						const adOption = {};
						adOption.fileName = banner.fileName;
						adOption.size = banner.size;
						adOption.url = campaign.url;
						adOption.cid = campaign.cid;
						adOption.bidPrice = campaign.active.bidPrice;
						adOption.advID = campaign.uid;
						adOption.device = adRequest.device;
						adOption.browser = adRequest.browser;
						adOption.domain = adRequest.domain;
						adOption.geo = adRequest.geo;
						adOption.pubID = adRequest.pubID;
						adOption.siteID = adRequest.siteID;
						adOption.subID = adRequest.subID;
						adOptions[banner.size].push(adOption);
					}
				});
			}
		});
		if (!adRequest.blockedInText && adRequest.keywords && adRequest.keywords.length > 0) {
			adRequest.keywords.forEach((keyword) => {
				if (JSE.adxActiveKeywords[keyword]) {
					const adOption = {};
					adOption.keyword = JSE.adxActiveKeywords[keyword].kw;
					adOption.url = JSE.adxActiveKeywords[keyword].url;
					adOption.cid = JSE.adxActiveKeywords[keyword].cid;
					adOption.bidPrice = JSE.adxActiveKeywords[keyword].bid;
					adOption.advID = JSE.adxActiveKeywords[keyword].uid;
					adOption.device = adRequest.device;
					adOption.browser = adRequest.browser;
					adOption.domain = adRequest.domain;
					adOption.geo = adRequest.geo;
					adOption.pubID = adRequest.pubID;
					adOption.siteID = adRequest.siteID;
					adOption.subID = adRequest.subID;
					adOptions.inText.push(adOption);
				}
			});
		}
		Object.keys(adOptions).forEach((key) => {
			adOptions[key].sort((a,b) => b.bidPrice - a.bidPrice);
		});
		//adOptions.bottomBanner.sort((a,b) => b.bidPrice - a.bidPrice);
		return adOptions;
	},

	/**
	 * @method <h2>pickAd</h2>
	 * @description choose which ad to display
	 * @returns {string} javascript code to inject on to page
	 */
	pickAd: (adOptions,adRequest,placement,alreadySelectedAds) => {
		let selectedAd = null;
		if (!adOptions[placement]) return selectedAd;
		if (alreadySelectedAds && alreadySelectedAds.length > 5) return selectedAd; // limit number of banner ads to 5

		function alreadSelected(cid) {
			if (!alreadySelectedAds) return false;
			for (let i = 0; i < alreadySelectedAds.length; i+=1) {
				if (alreadySelectedAds[i].cid === cid) return true;
			}
			return false;
		}

		if (adOptions[placement][0] && !alreadSelected(adOptions[placement][0].cid)) {
			selectedAd = adOptions[placement][0];
		}
		if (adOptions[placement][1] && !alreadSelected(adOptions[placement][1].cid)) {
			if (!selectedAd) {
				selectedAd = adOptions[placement][1];
			} else {
				const bidPercentageDiff = adOptions[placement][1].bidPrice / selectedAd.bidPrice;
				if (Math.random() < (bidPercentageDiff - 0.6)) selectedAd = adOptions[placement][1]; // this figure can be adjusted to vary first bid %
			}
		}
		if (adOptions[placement][2] && !alreadSelected(adOptions[placement][2].cid)) {
			if (!selectedAd) {
				selectedAd = adOptions[placement][2];
			} else {
				const bidPercentageDiff = adOptions[placement][2].bidPrice / selectedAd.bidPrice;
				if (Math.random() < (bidPercentageDiff - 0.7)) selectedAd = adOptions[placement][2];
			}
		}
		if (adOptions[placement][3] && !alreadSelected(adOptions[placement][3].cid)) {
			if (!selectedAd) {
				selectedAd = adOptions[placement][3];
			} else {
				const bidPercentageDiff = adOptions[placement][3].bidPrice / selectedAd.bidPrice;
				if (Math.random() < (bidPercentageDiff - 0.8)) selectedAd = adOptions[placement][3];
			}
		}
		if (adOptions[placement][4] && !alreadSelected(adOptions[placement][4].cid)) {
			if (!selectedAd) {
				selectedAd = adOptions[placement][4];
			} else {
				const bidPercentageDiff = adOptions[placement][4].bidPrice / selectedAd.bidPrice;
				if (Math.random() < (bidPercentageDiff - 0.85)) selectedAd = adOptions[placement][4];
			}
		}
		if (adOptions[placement][5] && !alreadSelected(adOptions[placement][5].cid)) {
			if (!selectedAd) {
				selectedAd = adOptions[placement][5];
			} else {
				const bidPercentageDiff = adOptions[placement][5].bidPrice / selectedAd.bidPrice;
				if (Math.random() < (bidPercentageDiff - 0.9)) selectedAd = adOptions[placement][5];
			}
		}
		for (let i = 6; i < 20 && !selectedAd; i+=1) { // just in case top campaign has 8 banners
			if (adOptions[placement][i] && !alreadSelected(adOptions[placement][i].cid)) {
				selectedAd = adOptions[placement][i];
			}
		}
		if (adOptions[placement][6] && !alreadSelected(adOptions[placement][6].cid)) {
			if (!selectedAd) {
				selectedAd = adOptions[placement][6];
			}
		}
		if (selectedAd) {
			jseAds.logAdStat(selectedAd,'i');
			jseAds.calcBidCost(selectedAd, function(bidCost) {
				jseAds.logAdStat(selectedAd,'j',bidCost);
			});
		}
		return selectedAd;
	},

	/**
	 * @method <h2>calcBidCost</h2>
	 * @description Calculate the bid cost of an ad
	 */
	calcBidCost: async(selectedAd,callback) => {
		let bidCost = JSE.jseFunctions.round(selectedAd.bidPrice / 1000);
		if (JSE.pubCache[selectedAd.pubID]) {
			bidCost = JSE.jseFunctions.round(bidCost * JSE.pubCache[selectedAd.pubID]);
			callback(bidCost);
		}
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayYYMMDD = yesterday.toISOString().slice(2,10).replace(/-/g,"");
		const pubData = await JSE.jseDataIO.asyncGetVar(`adxPubStats/${selectedAd.pubID}/${yesterdayYYMMDD}/`);
		JSE.pubCache[selectedAd.pubID] = 1;
		if (pubData) {
			let i = 0;
			let v = 0;
			let c = 0;
			Object.keys(pubData).forEach((siteID) => {
				if (pubData[siteID].i) i += pubData[siteID].i;
				if (pubData[siteID].v) v += pubData[siteID].v;
				if (pubData[siteID].c) c += pubData[siteID].c;
			});
			if (i > 100) {
				const validationRate = v/i;
				if (validationRate < 0.05) JSE.pubCache[selectedAd.pubID] *= 0.75;
				if (validationRate < 0.01) JSE.pubCache[selectedAd.pubID] *= 0.5;
				const clickRate = c/i;
				if (clickRate < 0.01) JSE.pubCache[selectedAd.pubID] *= 0.75;
				if (clickRate < 0.002) JSE.pubCache[selectedAd.pubID] *= 0.5;
				if (validationRate < 0.005 && clickRate < 0.001) JSE.pubCache[selectedAd.pubID] *= 0.1;
			}
			bidCost = JSE.jseFunctions.round(bidCost * JSE.pubCache[selectedAd.pubID]);
		}
		callback(bidCost);
	},

	/**
	 * @method <h2>poolPayment</h2>
	 * @description adds subproperties to JSE.adxPool object if they don't exist, eventually adds value
	 */
	poolPayment: (advID, pubID, perImpressionCost) => {
		//console.log('### Pool Payment ### '+advID+'/'+pubID+'/'+perImpressionCost)
		if (perImpressionCost > 0) {
			if (!JSE.adxPool.adxPayments) JSE.adxPool.adxPayments = {};
			if (String(parseInt(advID,10)) === String(advID)) {
				JSE.adxPool.adxPayments[advID] = (JSE.adxPool.adxPayments[advID] || 0) - perImpressionCost;
			}
			if (String(parseInt(pubID,10)) === String(pubID)) {
				JSE.adxPool.adxPayments[pubID] = (JSE.adxPool.adxPayments[pubID] || 0) + perImpressionCost;
			}
		}
	},

	/**
	 * @method <h2>addProperty</h2>
	 * @description adds subproperties to JSE.adxPool object if they don't exist, eventually adds value
	 */
	addProperty: (key, value) => {
		const keys = key.split('/');
		let keyCount = 0;
		for (let i = 0; i < keys.length; i+=1) {
			if (i === 0 && !JSE.adxPool[keys[0]]) JSE.adxPool[keys[0]] = {};
			if (i === 1 && !JSE.adxPool[keys[0]][keys[1]]) JSE.adxPool[keys[0]][keys[1]] = {};
			if (i === 2 && !JSE.adxPool[keys[0]][keys[1]][keys[2]]) JSE.adxPool[keys[0]][keys[1]][keys[2]] = {};
			if (i === 3 && !JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]]) JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]] = {};
			if (i === 4 && !JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]]) JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]] = {};
			if (i === 5 && !JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]][keys[5]]) JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]][keys[5]] = {};
			keyCount = i;
		}
		if (keyCount === 4) {
			if (typeof JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]] === 'object') {
				JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]] = value;
			} else {
				JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]] += value;
			}
		}
		if (keyCount === 5) {
			if (typeof JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]][keys[5]] === 'object') {
				JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]][keys[5]] = value;
			} else {
				JSE.adxPool[keys[0]][keys[1]][keys[2]][keys[3]][keys[4]][keys[5]] += value;
			}
		}
	},


	/**
	 * @method <h2>logAdImpression</h2>
	 * @description logs ad impression to adxPool
	 * jseAds.logAdImpression({advID:123,cid:54321,domain:'example.com',pubID:145,fileName:'asdf.jpg',geo:'US',device:'iphone',browser:'chrome'}); console.log(JSON.stringify(JSE));
	 */
	logAdStat: async(selectedAd,impression,value=1) => {
		const rightNow = new Date();
		const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,""); // could be done with setInterval
		jseAds.addProperty(`adxAdvStats/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${impression}`,value);
		jseAds.addProperty(`adxAdvDomains/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.domain}/${impression}`,value);
		jseAds.addProperty(`adxAdvPubIDs/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.pubID}/${impression}`,value);
		jseAds.addProperty(`adxAdvCreatives/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${(selectedAd.fileName || selectedAd.keyword)}/${impression}`,value);
		jseAds.addProperty(`adxAdvGeos/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.geo}/${impression}`,value);
		jseAds.addProperty(`adxAdvDevices/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.device}/${impression}`,value);
		jseAds.addProperty(`adxAdvBrowsers/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.browser}/${impression}`,value);

		jseAds.addProperty(`adxPubStats/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${impression}`,value);
		jseAds.addProperty(`adxPubDomains/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.domain}/${impression}`,value);
		jseAds.addProperty(`adxPubSubIDs/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.subID}/${impression}`,value);
		jseAds.addProperty(`adxPubAdvIDs/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.advID}/${impression}`,value);
		jseAds.addProperty(`adxPubGeos/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.geo}/${impression}`,value);
		jseAds.addProperty(`adxPubDevices/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.device}/${impression}`,value);
		jseAds.addProperty(`adxPubPlacements/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${(selectedAd.size || selectedAd.keyword)}/${impression}`,value);

		if (impression === 'c') {
			JSE.jseDataIO.setVariable('adxClicks/'+yymmdd+'/'+selectedAd.impressionID, selectedAd);
		}
		if (impression === 'j') {
			jseAds.poolPayment(selectedAd.advID,selectedAd.pubID,value);
		}
	},

	/**
	 * @method <h2>requestCode</h2>
	 * @description request javascript code to inject ads
	 * @returns {string} javascript code to inject on to page
	 */
	requestCode: async(adRequest,callback) => {
		let injectCode = '';
		const selectedAds = [];
		const adOptions = await jseAds.getAdOptions(adRequest);
		if (!adRequest.blockedAutoBanners) {
			if (!adRequest.blockedAutoBannerTop) {
				let preferredAdSize = '728x90';
				if (adRequest.innerWidth < 800) preferredAdSize = '300x100';
				const bestTopAd = jseAds.pickAd(adOptions,adRequest,preferredAdSize,null);
				if (bestTopAd) {
					const random = Math.floor((Math.random() * 999999) + 1);
					const ts = new Date().getTime();
					const selectedAd = {
						advID: bestTopAd.advID,
						cid: bestTopAd.cid,
						domain: adRequest.domain,
						pubID: adRequest.pubID,
						siteID: adRequest.siteID,
						subID: adRequest.subID,
						fileName: bestTopAd.fileName,
						url: bestTopAd.url,
						geo: adRequest.geo,
						device: adRequest.device,
						browser: adRequest.browser,
						size: bestTopAd.size,
						impressionTS: ts,
						impressionID: String(ts) +''+ String(random),
						price: JSE.jseFunctions.round(bestTopAd.bidPrice / 1000),
					};

					// Dynamic tracking variables for outlink, repeated below {postbackID} {campaignID} {publisherID} {domain} {creative} {geo} {device} {browser}
					selectedAd.url = selectedAd.url.split('{postbackID}').join(selectedAd.impressionID).split('{campaignID}').join(selectedAd.cid).split('{publisherID}').join(selectedAd.pubID).split('{domain}').join(selectedAd.domain).split('{creative}').join(selectedAd.fileName).split('{geo}').join(selectedAd.geo).split('{device}').join(selectedAd.device).split('{browser}').join(selectedAd.browser);

					selectedAds.push(selectedAd);
					injectCode += `
					function JSEinjectTopAd() {
						var elemDiv = document.createElement('div');
						elemDiv.style.cssText = 'position: relative; height: ${selectedAd.size.split('x')[1]}px; width: ${selectedAd.size.split('x')[0]}px; text-align: center;  z-index: 999999; margin: 0px auto;';
						elemDiv.id = '${selectedAd.impressionID}';
						var JSEInfoButton = '<img style="position: absolute; top: 1px; right: 14px; height: 12px; width: 12px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity = 0.9;" onmouseout="this.style.opacity = 0.7;" onclick="JSEDisplayInfo(${selectedAd.advID});" src="'+window.JSEInfoButtonSrc+'" alt="i" />';
						var JSECloseButton = '<img style="position: absolute; top: 1px; right: 1px; height: 12px; width: 12px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity = 0.9;" onmouseout="this.style.opacity = 0.7;" onclick="document.getElementById(\\'${selectedAd.impressionID}\\').style.display = \\'none\\';" src="'+window.JSECloseButtonSrc+'" alt="x" />';
						elemDiv.innerHTML = JSECloseButton+JSEInfoButton+'<div><iframe id="${selectedAd.impressionID}-iframe" FRAMEBORDER="0" SCROLLING="no" MARGINHEIGHT="0" MARGINWIDTH="0" TOPMARGIN="0" LEFTMARGIN="0" ALLOWTRANSPARENCY="true" WIDTH="${selectedAd.size.split('x')[0]}" HEIGHT="${selectedAd.size.split('x')[1]}"></iframe></div>';
						document.body.insertBefore(elemDiv, document.body.firstChild);
						var iframe = document.getElementById('${selectedAd.impressionID}-iframe');
						var iframeDoc = iframe.contentWindow.document;
						iframeDoc.write('<head></head><body><a href="${selectedAd.url}" rel="nofollow" target="_blank"><img src="https://adx.jsecoin.com/${selectedAd.fileName}" alt="${selectedAd.url}" /></a></body>');
					}
					JSEinjectTopAd();
					`;
				}
			}
			if (!adRequest.blockedAutoBannerBottom) {
				const bestBottomAd = jseAds.pickAd(adOptions, adRequest, '300x250',null);
				if (bestBottomAd) {
					const random2 = Math.floor((Math.random() * 999999) + 1);
					const ts = new Date().getTime();
					const selectedAd2 = {
						advID: bestBottomAd.advID,
						cid: bestBottomAd.cid,
						domain: adRequest.domain,
						pubID: adRequest.pubID,
						siteID: adRequest.siteID,
						subID: adRequest.subID,
						fileName: bestBottomAd.fileName,
						url: bestBottomAd.url,
						geo: adRequest.geo,
						device: adRequest.device,
						browser: adRequest.browser,
						size: bestBottomAd.size,
						impressionTS: ts,
						impressionID: String(ts) +''+ String(random2),
						price: JSE.jseFunctions.round(bestBottomAd.bidPrice / 1000),
					};
					selectedAd2.url = selectedAd2.url.split('{postbackID}').join(selectedAd2.impressionID).split('{campaignID}').join(selectedAd2.cid).split('{publisherID}').join(selectedAd2.pubID).split('{domain}').join(selectedAd2.domain).split('{creative}').join(selectedAd2.fileName).split('{geo}').join(selectedAd2.geo).split('{device}').join(selectedAd2.device).split('{browser}').join(selectedAd2.browser);

					selectedAds.push(selectedAd2);

					injectCode += `
					function JSEinjectBottomAd() {
						var elemDiv = document.createElement('div');
						elemDiv.style.cssText = 'position: relative; height: ${selectedAd2.size.split('x')[1]}px; width: ${selectedAd2.size.split('x')[0]}px; position: fixed; bottom: 0px; right: 2px; z-index: 999998;';
						elemDiv.id = '${selectedAd2.impressionID}';
						var JSEInfoButton = '<img style="position: absolute; top: 1px; right: 14px; height: 12px; width: 12px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity = 0.9;" onmouseout="this.style.opacity = 0.7;" onclick="JSEDisplayInfo(${selectedAd2.advID});" src="'+window.JSEInfoButtonSrc+'" alt="i" />';
						var JSECloseButton = '<img style="position: absolute; top: 1px; right: 1px; height: 12px; width: 12px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity = 0.9;" onmouseout="this.style.opacity = 0.7;" onclick="document.getElementById(\\'${selectedAd2.impressionID}\\').style.display = \\'none\\';" src="'+window.JSECloseButtonSrc+'" alt="x" />';
						elemDiv.innerHTML = JSECloseButton+JSEInfoButton+'<iframe id="${selectedAd2.impressionID}-iframe" FRAMEBORDER="0" SCROLLING="no" MARGINHEIGHT="0" MARGINWIDTH="0" TOPMARGIN="0" LEFTMARGIN="0" ALLOWTRANSPARENCY="true" WIDTH="${selectedAd2.size.split('x')[0]}" HEIGHT="${selectedAd2.size.split('x')[1]}"></iframe>';
						document.body.appendChild(elemDiv);
						var iframe = document.getElementById('${selectedAd2.impressionID}-iframe');
						var iframeDoc = iframe.contentWindow.document;
						iframeDoc.write('<head></head><body><a href="${selectedAd2.url}" rel="nofollow" target="_blank"><img src="https://adx.jsecoin.com/${selectedAd2.fileName}" id="${selectedAd2.impressionID}-banner" alt="${selectedAd2.url}" /></a></body>');
						setTimeout(function() {
							JSERiseUp(0,'${selectedAd2.impressionID}');
						},2000);
					}
					JSEinjectBottomAd();
					`;
				}
			}
		}

		if (adRequest.placements) {
			for (let i = 0; i < adRequest.placements.length; i+=1) {
				const placement = adRequest.placements[i];
				const bestAd = jseAds.pickAd(adOptions,adRequest,placement.size,selectedAds);
				if (bestAd) {
					const random = Math.floor((Math.random() * 999999) + 1);
					const ts = new Date().getTime();
					const selectedAd3 = {
						advID: bestAd.advID,
						cid: bestAd.cid,
						domain: adRequest.domain,
						pubID: adRequest.pubID,
						siteID: adRequest.siteID,
						subID: adRequest.subID,
						fileName: bestAd.fileName,
						url: bestAd.url,
						geo: adRequest.geo,
						device: adRequest.device,
						browser: adRequest.browser,
						size: bestAd.size,
						impressionTS: ts,
						impressionID: String(ts) +''+ String(random),
						price: JSE.jseFunctions.round(bestAd.bidPrice / 1000),
					};

					// Dynamic tracking variables for outlink, repeated below {postbackID} {campaignID} {publisherID} {domain} {creative} {geo} {device} {browser}
					selectedAd3.url = selectedAd3.url.split('{postbackID}').join(selectedAd3.impressionID).split('{campaignID}').join(selectedAd3.cid).split('{publisherID}').join(selectedAd3.pubID).split('{domain}').join(selectedAd3.domain).split('{creative}').join(selectedAd3.fileName).split('{geo}').join(selectedAd3.geo).split('{device}').join(selectedAd3.device).split('{browser}').join(selectedAd3.browser);

					selectedAds.push(selectedAd3);

					injectCode += `
					function JSEinjectAd${placement.placementID}() {
						var elemDiv = document.getElementById('JSE-banner-${placement.placementID}');
						elemDiv.style.cssText = 'position: relative; height: ${selectedAd3.size.split('x')[1]}px; width: ${selectedAd3.size.split('x')[0]}px; text-align: center;  z-index: 999999; margin: 0px auto;';
						var JSEInfoButton = '<img style="position: absolute; top: 1px; right: 14px; height: 12px; width: 12px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity = 0.9;" onmouseout="this.style.opacity = 0.7;" onclick="JSEDisplayInfo(${selectedAd3.advID});" src="'+window.JSEInfoButtonSrc+'" alt="i" />';
						var JSECloseButton = '<img style="position: absolute; top: 1px; right: 1px; height: 12px; width: 12px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity = 0.9;" onmouseout="this.style.opacity = 0.7;" onclick="document.getElementById(\\'JSE-banner-${placement.placementID}\\').style.display = \\'none\\';" src="'+window.JSECloseButtonSrc+'" alt="x" />';
						elemDiv.innerHTML = JSECloseButton+JSEInfoButton+'<iframe id="${selectedAd3.impressionID}-iframe" FRAMEBORDER="0" SCROLLING="no" MARGINHEIGHT="0" MARGINWIDTH="0" TOPMARGIN="0" LEFTMARGIN="0" ALLOWTRANSPARENCY="true" WIDTH="${selectedAd3.size.split('x')[0]}" HEIGHT="${selectedAd3.size.split('x')[1]}"></iframe>';
						var iframe = document.getElementById('${selectedAd3.impressionID}-iframe');
						var iframeDoc = iframe.contentWindow.document;
						iframeDoc.write('<head></head><body><a href="${selectedAd3.url}" rel="nofollow" target="_blank"><img src="https://adx.jsecoin.com/${selectedAd3.fileName}" alt="${selectedAd3.url}" /></a></body>');
					}
					JSEinjectAd${placement.placementID}();
					`;
				} else if (JSE.jseTestNet !== false) {
					console.log('No additional ads found');
				}
			}
		}

		if (!adRequest.blockedInText) {
			const bestInTextAd = jseAds.pickAd(adOptions,adRequest,'inText',null);
			if (bestInTextAd) {
				const random = Math.floor((Math.random() * 999999) + 1);
				const ts = new Date().getTime();
				const selectedAd = {
					advID: bestInTextAd.advID,
					cid: bestInTextAd.cid,
					domain: adRequest.domain,
					pubID: adRequest.pubID,
					siteID: adRequest.siteID,
					subID: adRequest.subID,
					keyword: bestInTextAd.keyword,
					url: bestInTextAd.url,
					geo: adRequest.geo,
					device: adRequest.device,
					browser: adRequest.browser,
					impressionTS: ts,
					impressionID: String(ts) +''+ String(random),
					price: JSE.jseFunctions.round(bestInTextAd.bidPrice / 1000),
				};

				// Dynamic tracking variables for outlink, repeated below {postbackID} {campaignID} {publisherID} {domain} {creative} {geo} {device} {browser}
				selectedAd.url = selectedAd.url.split('{postbackID}').join(selectedAd.impressionID).split('{campaignID}').join(selectedAd.cid).split('{publisherID}').join(selectedAd.pubID).split('{domain}').join(selectedAd.domain).split('{creative}').join(selectedAd.fileName).split('{geo}').join(selectedAd.geo).split('{device}').join(selectedAd.device).split('{browser}').join(selectedAd.browser).split('{keyword}').join(selectedAd.keyword);

				selectedAds.push(selectedAd);
				// code limits keyword injection to one time per keyword at this line: if (inTextLinks[kw].injectedCount >= 1) continue;
				injectCode += `
				function JSEInjectLinks() {
					var inTextLinks = { '${selectedAd.keyword}': { url: '${selectedAd.url}', injectedCount: 0 } }
					var paragraphs = document.getElementsByTagName('p');
					var keywords = [];
					for (var i = 0; i < paragraphs.length; i++) {
						if (paragraphs[i].innerHTML.indexOf('<script>') > -1) continue;
						for (var kw in inTextLinks) {
							if (!inTextLinks.hasOwnProperty(kw)) continue;
							var link = inTextLinks[kw].url;
							if (inTextLinks[kw].injectedCount >= 1) continue;
							var regex = new RegExp('(\\\\s|\\\\>)'+kw+'(\\\\s|\\\\.|\\\\?|\\\\!|\\\\<)');
							if (paragraphs[i].innerHTML.match(regex)) {
								inTextLinks[kw].injectedCount += 1;
								paragraphs[i].innerHTML = paragraphs[i].innerHTML.replace(regex,'$1<a href="'+link+'" title="JSE inText Advertising" id="JSE-intext-ad-'+kw+'" rel="nofollow" target="_blank">'+kw+'</a>$2');
							}
						}
					}
				}
				JSEInjectLinks();
				`;
			}
		}
		callback(injectCode,selectedAds);
	},

};

module.exports = jseAds;
