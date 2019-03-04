// inflate ledger 200x

const fs = require('fs');

const file = './../logs/adxAdvStats.json';

console.log('Starting JSON Import');

// Ledger
const jsonString = fs.readFileSync(file).toString();
const obj = JSON.parse(jsonString);

let totalSpend = 0;
let totalImpressions = 0;

Object.keys(obj).forEach(function(key) {
  const rightNow = new Date();
	rightNow.setDate(rightNow.getDate()-1); // -1 = yesterday
	const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
  if (obj[key][yymmdd]) {
    Object.keys(obj[key][yymmdd]).forEach((cid) => {
      const campaign = obj[key][yymmdd][cid];
      console.log(key+': '+campaign.i+' / '+campaign.j);
      totalSpend += campaign.j || 0;
      totalImpressions += campaign.i || 0;
    });
  }

  /*
  if (obj[key] && typeof obj[key]['badsitecom'] !== 'undefined') {
    console.log(JSON.stringify(obj[key]['badsitecom']));
  }
  */
});

console.log('Total Spend: '+totalSpend);
console.log('Total Impressions: '+totalImpressions);
