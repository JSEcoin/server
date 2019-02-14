// designed to be run on any server that is handling 15 min backups
// forever start purgebkup.js &

const jseTestNet = false; // 'remote', 'local' or false for production

const fs = require('fs');

const bkupDir = './../logs/';

const date = new Date();
date.utc = date.toUTCString();

function startPurge() {
	// keep every file for 3 hours, then remove all but one per hour for 24 hours, then remove all but one per day for longer than that
	if (jseTestNet) console.log('Starting bkup file purge...');
	fs.readdir(bkupDir, function(err, files) {
		// sort by date modified
		const fileNames = files.map(function (fileName) {
			return {
				name: fileName,
				time: fs.statSync(bkupDir + fileName).mtime.getTime(),
			};
		})
		.sort(function (a, b) {
			return a.time - b.time;
		})
		.map(function (v) {
			return v.name;
		});
		if (fileNames) {
			const toBin = [];
			for (let i=0; i<fileNames.length; i+=1) {
				const fileName = fileNames[i];
				if (fileName.indexOf('.tar.gz') > -1) {
					toBin.push(fileName);
				}
			}
			const savedFiles = [];
			const deletedFiles = [];
			for (let i = 0; i < 50; i+=1) { // save last 50 bkups
				if (toBin.length > 0) {
					const theFile = toBin.pop();
					savedFiles.push(theFile);
				}
			}
			for (let i = 0; i < 200; i+=1) { // save every other last 200 bkups
				if (toBin.length > 0) {
					const theFile = toBin.pop();
					if (i % 2 === 0) { // even number
						savedFiles.push(theFile);
					} else {
						deletedFiles.push(theFile);
					}
				}
			}
			for (let i = 0; i < 999; i+=1) { // delete everything else
				if (toBin.length > 0) {
					const theFile = toBin.pop();
					deletedFiles.push(theFile);
				}
			}
			console.log(date.utc+' - Saved Files: '+JSON.stringify(savedFiles));
			console.log(date.utc+' - Deleted Files: '+JSON.stringify(deletedFiles));

			for (let i = 0; i < deletedFiles.length; i+=1) {
				const binFilename = deletedFiles[i];
				if (jseTestNet) console.log('Deleting file: '+binFilename);
				fs.unlink(bkupDir+binFilename,function(err3){
					if (err3) console.log('DB.js ERROR DELETING FILE: '+binFilename+' - Error: '+err3);
				});
			}
		}
	});
}

startPurge();

setInterval(function() {
	startPurge();
}, 900000); // 15 mins
