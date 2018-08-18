/* Quick script to see how many sites we have opted in to display advertising */

const siteIDs = require('./../data/siteids.json'); // eslint-disable-line

let marketing = 0;
Object.keys(siteIDs).forEach(function(i) {
  if (siteIDs[i]) {
    let maxSiteCount = 0;
    Object.keys(siteIDs[i]).forEach(function(i2) {
      maxSiteCount +=1;
      if (siteIDs[i][i2] && siteIDs[i][i2].m === true && maxSiteCount < 100 && siteIDs[i][i2].s !== 'Platform Mining' && siteIDs[i][i2].s !== 'undefined') marketing += 1;
    });
  }
});

console.log('Sites opted in for advertising: '+marketing);
