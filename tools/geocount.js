/* Quick script to see how many sites we have opted in to display advertising */ // eslint-disable-line

const pubMLData = require('./../logs/cli-publisherMLData.json'); // eslint-disable-line

let pubs = 0;
const geos = {};
const devices = {};
Object.keys(pubMLData).forEach(function(uid) {
  if (pubMLData[uid]) {
    pubs += 1;
    pubMLData[uid].forEach((hit) => {
      const geoCode = hit[3];
      const device = hit[0];

      if (geoCode && geoCode < 80) {
        if (!geos[geoCode]) geos[geoCode] = 0;
        geos[geoCode] += 1;
      }

      if (device && device < 5) {
        if (!devices[device]) devices[device] = 0;
        devices[device] += 1;
      }
    });
  }
});

let totalHits = 0;
const sortable = [];
Object.keys(geos).forEach((numericGeo) => {
//for (let numericGeo in geos) {
  let geo = 'Unknown';
  if (parseInt(numericGeo,10) === 60) geo = 'US';
  if (parseInt(numericGeo,10) === 59) geo = 'CA';
  if (parseInt(numericGeo,10) === 58) geo = 'GB';
  if (parseInt(numericGeo,10) === 57) geo = 'AU';
  if (parseInt(numericGeo,10) === 56) geo = 'NZ';
  if (parseInt(numericGeo,10) === 55) geo = 'DE';
  if (parseInt(numericGeo,10) === 54) geo = 'IE';
  if (parseInt(numericGeo,10) === 53) geo = 'SG';
  if (parseInt(numericGeo,10) === 52) geo = 'HK';
  if (parseInt(numericGeo,10) === 51) geo = 'CH';
  if (parseInt(numericGeo,10) === 50) geo = 'NO';
  if (parseInt(numericGeo,10) === 49) geo = 'FR';
  if (parseInt(numericGeo,10) === 48) geo = 'JP';
  if (parseInt(numericGeo,10) === 47) geo = 'KR';
  if (parseInt(numericGeo,10) === 46) geo = 'CZ';
  if (parseInt(numericGeo,10) === 45) geo = 'IT';
  if (parseInt(numericGeo,10) === 44) geo = 'ES';
  if (parseInt(numericGeo,10) === 43) geo = 'LT';
  if (parseInt(numericGeo,10) === 42) geo = 'FI';
  if (parseInt(numericGeo,10) === 41) geo = 'AT';
  if (parseInt(numericGeo,10) === 40) geo = 'BE';
  if (parseInt(numericGeo,10) === 39) geo = 'IL';
  if (parseInt(numericGeo,10) === 38) geo = 'DK';
  if (parseInt(numericGeo,10) === 37) geo = 'SK';
  if (parseInt(numericGeo,10) === 36) geo = 'SI';
  if (parseInt(numericGeo,10) === 35) geo = 'TW';
  if (parseInt(numericGeo,10) === 34) geo = 'PT';
  if (parseInt(numericGeo,10) === 33) geo = 'PL';
  if (parseInt(numericGeo,10) === 32) geo = 'BR';
  if (parseInt(numericGeo,10) === 31) geo = 'BG';
  if (parseInt(numericGeo,10) === 30) geo = 'RO';
  if (parseInt(numericGeo,10) === 29) geo = 'TH';
  if (parseInt(numericGeo,10) === 28) geo = 'MY';
  if (parseInt(numericGeo,10) === 27) geo = 'HU';
  if (parseInt(numericGeo,10) === 26) geo = 'ZA';
  if (parseInt(numericGeo,10) === 25) geo = 'TR';
  if (parseInt(numericGeo,10) === 24) geo = 'GR';
  if (parseInt(numericGeo,10) === 23) geo = 'CO';
  if (parseInt(numericGeo,10) === 22) geo = 'PE';
  if (parseInt(numericGeo,10) === 21) geo = 'VE';
  if (parseInt(numericGeo,10) === 20) geo = 'MX';
  if (parseInt(numericGeo,10) === 19) geo = 'AR';
  if (parseInt(numericGeo,10) === 18) geo = 'LV';
  if (parseInt(numericGeo,10) === 17) geo = 'PH';
  if (parseInt(numericGeo,10) === 16) geo = 'IN';
  if (parseInt(numericGeo,10) === 15) geo = 'PK';
  if (parseInt(numericGeo,10) === 14) geo = 'ET';
  if (parseInt(numericGeo,10) === 13) geo = 'VN';
  if (parseInt(numericGeo,10) === 12) geo = 'NL';
  if (parseInt(numericGeo,10) === 11) geo = 'SE';
  if (parseInt(numericGeo,10) === 10) geo = 'NG';
  if (parseInt(numericGeo,10) === 9) geo = 'CN';
  if (parseInt(numericGeo,10) === 8) geo = 'RU';
  if (parseInt(numericGeo,10) === 7) geo = 'UA';
  if (parseInt(numericGeo,10) === 6) geo = 'ID';
  if (parseInt(numericGeo,10) === 5) geo = 'XX';
  if (parseInt(numericGeo,10) === 4) geo = 'A1';
  if (parseInt(numericGeo,10) === 3) geo = 'A2';
  if (parseInt(numericGeo,10) === 2) geo = 'SPARE';
  if (parseInt(numericGeo,10) === 1) geo = 'SPARE';

  sortable.push([geo, geos[numericGeo]]);
  totalHits += geos[numericGeo];
});

let totalHitsDevices = 0;
const sortableDevices = [];
Object.keys(devices).forEach((deviceCode) => {
//for (let deviceCode in devices) {
  let dev = 'Unknown';
  //if (parseInt(deviceCode,10) === 0) dev = 'Unknown';
  if (parseInt(deviceCode,10) === 1) dev = 'Bot';
  if (parseInt(deviceCode,10) === 2) dev = 'Mobile';
  if (parseInt(deviceCode,10) === 3) dev = 'Desktop';
  sortableDevices.push([dev, devices[deviceCode]]);
  totalHitsDevices += devices[deviceCode];
});

sortable.sort(function(a, b) {
    return a[1] - b[1];
});
sortable.reverse();

sortableDevices.sort(function(a, b) {
  return a[1] - b[1];
});
sortableDevices.reverse();

let totalPercent = 0;
const percentages = sortable.map((a) => {
  const percentage =((a[1] / totalHits) * 100).toFixed(2);
  totalPercent += parseFloat(percentage);
  return [a[0], percentage];
});

const percentagesDevices = sortableDevices.map((a) => {
  const percentage =((a[1] / totalHitsDevices) * 100).toFixed(2);
  return [a[0], percentage];
});

let output = `Pubs: ${pubs}\n\nDevices:\n`;
percentagesDevices.forEach((p) => {
  output += `${p[0]} ${p[1]}%\n`;
});
output += `\nGeos:\n`;
percentages.forEach((p) => {
  output += `${p[0]} ${p[1]}%\n`;
});

console.log(output);
