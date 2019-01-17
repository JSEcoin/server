/* global describe it done */
const JSE = global.JSE;
const assert = require('assert');

JSE.adxPool = {};
JSE.jseFunctions = require('./../modules/functions.js');
const jseAds = require("./../modules/ads.js");

describe('jseAds Unit Test', function() {
	it('jseAds.logAdStat', function() {
    const selectedAd = { advID: 123, cid: 54321, domain: 'example.com', pubID: 145, fileName: 'asdf.jpg', geo: 'US', device: 'iphone', browser: 'chrome' };
    jseAds.logAdStat(selectedAd,'i');
    jseAds.logAdStat(selectedAd,'j',0.003);
    jseAds.logAdStat(selectedAd,'i');
    jseAds.logAdStat(selectedAd,'j',0.001);
    const rightNow = new Date();
    const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
    //console.log(JSON.stringify(JSE.adxPool));
    assert(JSE.adxPool.adxAdvStats[selectedAd.advID][yymmdd][selectedAd.cid].j === 0.004);
	});

  // other unit tests can be added once we have live campaign data
});
