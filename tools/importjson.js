// inflate ledger 200x

const fs = require('fs');

const file = './../logs/cli-siteIDs.json';

console.log('Starting JSON Import');

// Ledger
const jsonString = fs.readFileSync(file).toString();
const obj = JSON.parse(jsonString);

Object.keys(obj).forEach(function(key) {
  //console.log(key);
  if (obj[key] && typeof obj[key]['badsitecom'] !== 'undefined') {
    console.log(JSON.stringify(obj[key]['badsitecom']));
  }
});

