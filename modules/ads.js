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
		adOptions.topBanner = [];
		adOptions.bottomBanner = [];
		JSE.adxActiveCampaigns.forEach((campaign) => {
			if (!campaign.active[adRequest.geo]) return;
			if (!campaign.devices && !campaign[adRequest.device]) return;
			if (!campaign.browsers && !campaign[adRequest.browser]) return;
			if (campaign.domainBlacklist.indexOf(adRequest.domain) > -1) return;
			if (campaign.domainWhitelist.indexOf('.') > -1 && campaign.domainWhitelist.indexOf(adRequest.domain) === -1) return;
			if (campaign.publisherBlacklist.indexOf(adRequest.pubID) > -1) return;
			if (campaign.publisherWhitelist.length > 1 && campaign.publisherWhitelist.indexOf(adRequest.pubID) === -1) return;
			if (adRequest.blockedAdvertisers.indexOf(campaign.uid) > -1) return;
			if (!adRequest.blockedBanners) {
				campaign.banners.forEach((banner) => {
					if ((banner.size === '300x100' && adRequest.innerWidth < 800) || (banner.size === '728x90' && adRequest.innerWidth >= 800)) {
						const adOption = {};
						adOption.fileName = banner.fileName;
						adOption.size = banner.size;
						adOption.cid = campaign.cid;
						adOption.id = 'JSE-ad-header-'+adOption.cid;
						adOption.bidPrice = campaign.active.bidPrice;
						adOption.advID = campaign.uid;
						adOption.device = adRequest.device;
						adOption.browser = adRequest.browser;
						adOption.geo = adRequest.geo;
						adOption.pubID = adRequest.adRequest.pubID;
						adOption.siteID = adRequest.siteID;
						adOption.subID = adRequest.subID;
						adOptions.topBanner.push(adOption);
					}
					if ((banner.size === '300x250' && adRequest.innerWidth >= 800)) {
						const adOption = {};
						adOption.fileName = banner.fileName;
						adOption.size = banner.size;
						adOption.cid = campaign.cid;
						adOption.id = 'JSE-ad-float-'+adOption.cid;
						adOption.bidPrice = campaign.active.bidPrice;
						adOption.advID = campaign.uid;
						adOption.device = adRequest.device;
						adOption.browser = adRequest.browser;
						adOption.geo = adRequest.geo;
						adOption.pubID = adRequest.adRequest.pubID;
						adOption.siteID = adRequest.siteID;
						adOption.subID = adRequest.subID;
						adOptions.bottomBanner.push(adOption);
					}
				});
			}
		});
		adOptions.topBanner.sort((a,b) => b.bidPrice - a.bidPrice);
		adOptions.bottomBanner.sort((a,b) => b.bidPrice - a.bidPrice);
		return adOptions;
	},

	/**
	 * @method <h2>pickAd</h2>
	 * @description choose which ad to display
	 * @returns {string} javascript code to inject on to page
	 */
	pickAd: async(adOptions,adRequest,placement) => {
		let selectedAd = {};
		if (adOptions[placement][0]) {
			selectedAd = adOptions[placement][0];
		}
		if (adOptions[placement][1]) {
			const bidPercentageDiff = adOptions[placement][1] / selectedAd.bidPrice;
			if (Math.random() < (bidPercentageDiff - 0.5)) { // if prices are very close split 50/50
				selectedAd = adOptions[placement][1];
			}
		}
		if (adOptions[placement][2]) {
			const bidPercentageDiff = adOptions[placement][2] / selectedAd.bidPrice;
			if (Math.random() < (bidPercentageDiff - 0.66)) { // if prices are very close split 33/33/33
				selectedAd = adOptions[placement][2];
			}
		}
		if (adOptions[placement][3]) {
			const bidPercentageDiff = adOptions[placement][3] / selectedAd.bidPrice;
			if (Math.random() < (bidPercentageDiff - 0.75)) { // if prices are very close split 25%
				selectedAd = adOptions[placement][3];
			}
		}
		this.logAdImpression(selectedAd);
		return selectedAd;
	},

	/**
	 * @method <h2>addProperty</h2>
	 * @description adds subproperties to JSE.adxPool object if they don't exist, eventually adds value
	 */
	addProperty: (key, value) => {
		const keys = key.split('/');
		while (keys.length > 1) {
			const k = keys.shift();
			if (!JSE.adxPool.hasOwnProperty(k)) { // eslint-disable-line
				JSE.adxPool[k] = {};
			}
			JSE.adxPool = JSE.adxPool[k];
		}
		JSE.adxPool[keys[0]] = (JSE.adxPool[keys[0]] || 0) + value;
	},

	/**
	 * @method <h2>logAdImpression</h2>
	 * @description logs ad impression to adxPool
	 * jseAds.logAdImpression({advID:123,cid:54321,domain:'example.com',pubID:145,fileName:'asdf.jpg',geo:'US',device:'iphone',browser:'chrome'}); console.log(JSON.stringify(JSE));
	 */
	logAdImpression: async(selectedAd) => {
		const rightNow = new Date();
		const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,""); // could be done with setInterval
		this.addProperty(`adxAdvStats/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/i`,1);
		this.addProperty(`adxAdvDomains/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.domain}/i`,1);
		this.addProperty(`adxAdvPubIDs/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.pubID}/i`,1);
		this.addProperty(`adxAdvCreatives/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.fileName}/i`,1);
		this.addProperty(`adxAdvGeos/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.geo}/i`,1);
		this.addProperty(`adxAdvDevices/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.device}/i`,1);
		this.addProperty(`adxAdvBrowsers/${selectedAd.advID}/${yymmdd}/${selectedAd.cid}/${selectedAd.browser}/i`,1);

		this.addProperty(`adxPubStats/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/i`,1);
		this.addProperty(`adxPubDomains/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.domain}/i`,1);
		this.addProperty(`adxPubSubIDs/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.subID}/i`,1);
		this.addProperty(`adxPubAdvIDs/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.advID}/i`,1);
		this.addProperty(`adxPubGeos/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.geo}/i`,1);
		this.addProperty(`adxPubDevices/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.device}/i`,1);
		this.addProperty(`adxPubPlacements/${selectedAd.pubID}/${yymmdd}/${selectedAd.siteID}/${selectedAd.browser}/i`,1);
	},

	/**
	 * @method <h2>requestCode</h2>
	 * @description request javascript code to inject ads
	 * @returns {string} javascript code to inject on to page
	 */
	requestCode: async(adRequest,callback) => {
		const adOptions = await this.getAdOptions(adRequest);
		const bestTopAd = await this.pickAd(adOptions,adRequest,'topBanner');
		let injectCode = `
		var JSECloseButtonSrc = 'data:image/png;base64,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';
		function JSEinjectTopAd() {
			var elemDiv = document.createElement('div');
			elemDiv.style.cssText = 'height: ${bestTopAd.size.split('x')[1]}px; width: 100%; text-align: center;  z-index: 999999;';
			elemDiv.id = '${bestTopAd.id}';
			var closePosition = (document.body.clientWidth / 2) - ${parseInt(bestTopAd.size.split('x')[0],10) / 2} + 12;
			var closeButton = '<img style="position: absolute; right: '+closePosition+'px; top: 12px; height: 12px; width: 12px; cursor: pointer;" onclick="document.getElementById(\\'${bestTopAd.id}\\').style.display = \\'none\\';" src="'+JSECloseButtonSrc+'" alt="x" />';
			elemDiv.innerHTML = '<a href="${bestTopAd.outlink}" target="_blank"><img src="${bestTopAd.banner}" alt="${bestTopAd.outlink}" /></a>'+closeButton;
			document.body.insertBefore(elemDiv, document.body.firstChild);
		}
		JSEinjectTopAd();
		`;

		let bestBottomAd = null;
		if (adOptions.bottomBanner[0]) {
			bestBottomAd = await this.pickAd(adOptions,'bottomBanner');
			injectCode += `
			function JSEinjectBottomAd() {
				var elemDiv = document.createElement('div');
				elemDiv.style.cssText = 'height: ${bestBottomAd.size.split('x')[1]}px; width: ${bestBottomAd.size.split('x')[0]}px; position: fixed; bottom: 0px; right: 0px; z-index: 999998;';
				elemDiv.id = '${bestBottomAd.id}';
				var closeButton = '<img style="position: absolute; right: '+closePosition+'px; top: 12px; height: 12px; width: 12px; cursor: pointer;" onclick="document.getElementById(\\'${bestBottomAd.id}\\').style.display = \\'none\\';" src="'+JSECloseButtonSrc+'" alt="x" />';
				elemDiv.innerHTML = '<a href="${bestBottomAd.outlink}" target="_blank"><img src="${bestBottomAd.banner}" alt="${bestBottomAd.outlink}" /></a>'+closeButton;
				document.body.appendChild(elemDiv);
				setTimeout(function() {
					riseUp(0);
				},2000);
			}
			function isBehindOtherElement(element) {
				var boundingRect = element.getBoundingClientRect();
				var left = boundingRect.left + 1;
				var right = boundingRect.right - 1;
				var top = boundingRect.top + 1;
				var bottom = boundingRect.bottom - 1;
				if (document.elementFromPoint(left, top) !== element) return true;
				if (document.elementFromPoint(right, top) !== element) return true;
				if (document.elementFromPoint(left, bottom) !== element) return true;
				if (document.elementFromPoint(right, bottom) !== element) return true;
				return false;
			}
			function riseUp(riseUpPixels) {
				var floatingDiv = document.getElementById('${bestBottomAd.id}');
				if (isBehindOtherElement(floatingDiv) && riseUpPixels < (window.innerHeight - 350)) { // 250 height + 90px for top banner + 10px for margin
					if (riseUpPixels > 110 && riseUpPixels <= 120) {
						riseUpPixels += 5;
					} else if (riseUpPixels > 120 && riseUpPixels <= 130) {
						riseUpPixels += 2;
					} else if (riseUpPixels > 130 && riseUpPixels <= 140) {
						riseUpPixels += 1;
					} else {
						riseUpPixels += 10;
					}
					floatingDiv.style.bottom = riseUpPixels + 'px';
					setTimeout(function() {
						riseUp(riseUpPixels);
					}, 50);
				}
			}
			JSEinjectBottomAd();
			`;
		}

		callback(injectCode,bestTopAd,bestBottomAd);
	},

};

module.exports = jseAds;
