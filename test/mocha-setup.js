/* global describe it done */
const JSE = global.JSE;
const assert = require('assert');
const fs = require('fs');


/* Some functions to read user input for building credential file */
function getStdin(endByte) {
	const BUFSIZE = 256;
	const buf = Buffer.alloc(BUFSIZE);
	let totalBuf = Buffer.alloc(BUFSIZE);
	let totalBytesRead = 0;
	let bytesRead = 0;
	let endByteRead = false;

	let fd = process.stdin.fd;
	let usingDevice = false;
	try {
		fd = fs.openSync('/dev/stdin', 'rs');
		usingDevice = true;
	} catch (e) {
		console.log('');
	}
	for (;;) {
		try {
			bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
			const tmpBuf = Buffer.alloc(totalBytesRead + bytesRead);
			totalBuf.copy(tmpBuf, 0, 0, totalBytesRead);
			buf.copy(tmpBuf, totalBytesRead, 0, bytesRead);
			totalBuf = tmpBuf;
			totalBytesRead += bytesRead;

			// Has the endByte been read?
			for (let i = 0; i < bytesRead; i+=1) {
				if (buf[i] === endByte) {
					endByteRead = true;
					break;
				}
			}
			if (endByteRead) { break; }
		} catch (e) {
			if (e.code === 'EOF') { break; }
			throw e;
		}
		if (bytesRead === 0) { break; }
	}
	if (usingDevice) { fs.closeSync(fd); }
	return totalBuf;
}
let stdin = '';

function getline() {
	if (stdin.length === 0) {
		stdin = getStdin('\n'.charCodeAt(0)).toString('utf-8');
	}
	const newline = stdin.search('\n') + 1;
	const line = stdin.slice(0, newline);
	// Flush
	stdin = stdin.slice(newline);
	return line;
}


describe('Test Credentials', function() {
	describe('Checking Test Credentials', function() {
		if (fs.existsSync('./.testcredentials.json')) {
			it('Found and using file: ./.testcredentials.json', function() {

			});
		} else {
			it('Creating New Test File', function() {
				console.log('No ./.testcredentials.json file found');
				console.log('Lets build one now, it will donate 0.000x JSE from your account to charity@jsecoin.com');
				const credentialsObject = {};
				credentialsObject.user1 = {};
				console.log('Enter an account email:');
				credentialsObject.user1.email = getline().trim();
				console.log('Enter corresponding password:');
				credentialsObject.user1.password = getline().trim();
				console.log('Enter corresponding API Key (Make sure to set it to write access):');
				credentialsObject.user1.apiKey = getline().trim();
				// session is taken from database - datastoretest.js
				//console.log('Enter a Session Key (Log in to platform and check query in console):');
				//credentialsObject.user1.session = getline().trim();
				credentialsObject.user2 = {};
				credentialsObject.user2.email = 'charity@jsecoin.com';
				credentialsObject.user2.uid = '2895';
				credentialsObject.user2.merchantAuthKey = 'LP02h';
				credentialsObject.user2.publicKey = '045a0688dcaf1ca952b26895f3b885b398dd7318f71f306e4d519901c4c34f12486e46345b87f00de1e381729ecddc0ef9d05c0fd5d0a9d3d1b7b3ecb92df774be';
				console.log('Writing new credentials file');
				fs.writeFileSync('./.testcredentials.json', JSON.stringify(credentialsObject));
				console.log('All done, please restart the test');
				process.exit();
			});
		}
	});
});

const cExport = {};
console.log('Test API? (Y/N):');
if (getline().trim().match(/^(Y|y)(es)?(ES)?$/)) {
	cExport.testAPI = true;
}
console.log('Test Server Routes? (Y/N):');
if (getline().trim().match(/^(Y|y)(es)?(ES)?$/)) {
	cExport.testRoutes = true;
}

module.exports = cExport;
