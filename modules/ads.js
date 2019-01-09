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
            adOption.bidPrice = campaign.active.bidPrice;
            adOptions.topBanner.push(adOption);
          }
          if ((banner.size === '300x250' && adRequest.innerWidth >= 800)) {
            const adOption = {};
            adOption.fileName = banner.fileName;
            adOption.size = banner.size;
            adOption.cid = campaign.cid;
            adOption.bidPrice = campaign.active.bidPrice;
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
	 * @method <h2>requestCode</h2>
	 * @description request javascript code to inject ads
	 * @returns {string} javascript code to inject on to page
	 */
	requestCode: async(adRequest,callback) => {

    const adOptions = await getAdOptions(adRequest);
    const pickAds = await pickAds(adOptions);

    if (adRequest.innerWidth > 800) {
      bestTopAd = this.getbestAd('728x90',adRequest);
    } else {
      bestTopAd = this.getbestAd('300x100',adRequest);
    }
    bestFloatAd = this.getbestAd('300x250',adRequest);

    const requestCode = `
    window.jseClick${bestTopAd.campaignID} = document.createEvent('Event');
    jseClick${bestTopAd.campaignID}.initEvent('jseClick${bestTopAd.campaignID}', true, true);
    function JSEinjectTopAd() {
      var elemDiv = document.createElement('div');
      elemDiv.style.cssText = 'height: ${bestTopAd.adHeight}px; width: 100%; text-align: center; z-index: 999999;';
      var closePosition = (document.body.clientWidth / 2) - 364 + 12;
      var closeButton = '<img style="position: absolute; right: '+closePosition+'px; top: 12px; height: 12px; width: 12px; cursor: pointer;" onclick="document.getElementById(\\'JSE-ad-header-${bestTopAd.adWidth}x${bestTopAd.adHeight}\\').style.display = \\'none\\';" src="data:image/png;base64,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" alt="x" />';
      elemDiv.innerHTML = '<a href="${bestTopAd.outlink}" onclick="document.dispatchEvent(jseClick${bestTopAd.campaignID});" target="_blank"><img src="${bestTopAd.banner}" alt="${bestTopAd.outlink}" /></a>'+closeButton;
      document.body.insertBefore(elemDiv, document.body.firstChild);
      console.log('Injected JSE Banner Ad');
    }
    JSEinjectTopAd();
    `;
		callback(requestCode,campaignIDs);
  },

};

module.exports = jseAds;
