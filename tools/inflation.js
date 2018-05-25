// inflate ledger 200x

const fs = require('fs');

const dataDir = './../data/';

function round(value) {
	const decimals = 8;
	return Number(parseFloat(value).toFixed(decimals));
}

console.log('Starting inflation program');

// Ledger
const ledgerString = fs.readFileSync(dataDir+'ledger.json').toString();
const ledger = JSON.parse(ledgerString);

//const ledger2 = [];
const ledger2 = {};
let marketCap = 0;
Object.keys(ledger).forEach(function(key) {
	//ledger2.push(round(ledger[key] * 200));
	ledger2[key] = round(ledger[key] * 200);
	marketCap += ledger2[key];
});

// Exported
const exportedString = fs.readFileSync(dataDir+'exported.json').toString();
const exported = JSON.parse(exportedString);

const exported2 = {};
let exportCap = 0;
Object.keys(exported).forEach(function(key) {
	exported2[key] = exported[key];
	exported2[key].value = round(exported[key].value * 200);
	if (exported2[key].used === false) {
		exportCap += exported2[key].value;
	}
});

console.log('Market cap is now '+round(marketCap));
console.log('Export cap is now '+round(exportCap));
fs.writeFile(dataDir+'ledger2.json', JSON.stringify(ledger2), 'utf8', function(error) { // write over file using utf8 encoding, may need to change if we accept unicode etc.
	if (error) { console.log('ERROR: Error writing file ledger2.json'); }
});
fs.writeFile(dataDir+'exported2.json', JSON.stringify(exported2), 'utf8', function(error) { // write over file using utf8 encoding, may need to change if we accept unicode etc.
	if (error) { console.log('ERROR: Error writing file exported2.json'); }
});

console.log('Copy ledger2.json over ledger.json and exported2.json over exported.json in the ../data directory');
