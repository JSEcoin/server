/**
 * @module jseDataIO
 * @description JSE Data IO connects via socket.io with a key &gt; value storage facility such as firebase/reddis/datastore.js
 * <h5>Exported</h5>
 * <ul>
 * <li>setVariable</li>
 * <li>getVariable</li>
 * <li>setVariableThen</li>
 * <li>pushVariable</li>
 * <li>deleteVariable</li>
 * <li>plusX</li>
 * <li>storeFile</li>
 * <li>backup</li>
 * <li>closeConnection</li>
 * <li>genSafeKey</li>
 * <li>checkExists</li>
 * <li>countValues</li>
 * <li>plusOne</li>
 * <li>minusX</li>
 * <li>buildLedger</li>
 * <li>newBlockID</li>
 * <li>saveNewBlock</li>
 * <li>pushBlockData</li>
 * <li>getBlock</li>
 * <li>solvedBlock</li>
 * <li>getBlockRef</li>
 * <li>checkUniqueEmail</li>
 * <li>reserveUID</li>
 * <li>addUser</li>
 * <li>checkDuplicate</li>
 * <li>getEmail</li>
 * <li>getCredentialsByPassword</li>
 * <li>getCredentialsBySession</li>
 * <li>getCredentialsByAPIKey</li>
 * <li>getCredentialsByUID</li>
 * <li>getUserData</li>
 * <li>getUserByEmail</li>
 * <li>lookupEmail</li>
 * <li>lookupSession</li>
 * <li>lookupPublicKey</li>
 * <li>lookupAPIKey</li>
 * <li>setupNewTransaction</li>
 * <li>checkUserByPublicKey</li>
 * <li>getUserByPublicKey</li>
 * <li>getUserByUID</li>
 * <li>addBalance</li>
 * <li>minusBalance</li>
 * <li>getTransactionReference</li>
 * <li>checkCredentialsByAPIKey</li>
 * <li>updatePublicStats</li>
 * <li>getMyExportedCoins</li>
 * <li>getMyExportedCoins</li>
 * <li>getAdminAccounts</li>
 * <li>resetDailyStats</li>
 * <li>getPubStats</li>
 * <li>miningMaintenance</li>
 * <li>countSubValues</li>
 * </ul>
*/

const JSE = global.JSE;
const fs = require('fs'); // only required temporarily for testing
const io = require('socket.io-client');
const jseEthIntegration = require("./ethintegration.js");
const jseExchanges = require('./exchanges.js');

let dataStore1 = {};
let blockStore1 = {};
let adxStore1 = {};

function connectSockets() {
	dataStore1 = io.connect(JSE.dataStore1, {
		reconnect: true, transports: ["websocket"], heartbeatTimeout: 1800000, maxHttpBufferSize: 1000000000,
	});

	blockStore1 = io.connect(JSE.blockStore1, {
		reconnect: true, transports: ["websocket"], heartbeatTimeout: 1800000, maxHttpBufferSize: 1000000000,
	});

	adxStore1 = io.connect(JSE.adxStore1, {
		reconnect: true, transports: ["websocket"], heartbeatTimeout: 1800000, maxHttpBufferSize: 1000000000,
	});

	// Connection and authorization
	dataStore1.on('connect', function(){
		if (JSE.authenticatedNode) {
			console.log('Connected to dataStore1, sending authorization key');
			dataStore1.emit('authorize',JSE.credentials.dbKey);
		}
	});
	blockStore1.on('connect', function(){
		if (JSE.authenticatedNode) {
			console.log('Connected to blockStore1, sending authorization key');
			blockStore1.emit('authorize',JSE.credentials.dbKey);
		}
	});
	adxStore1.on('connect', function(){
		if (JSE.authenticatedNode) {
			console.log('Connected to adxStore1, sending authorization key');
			adxStore1.emit('authorize',JSE.credentials.dbKey);
		}
	});

	dataStore1.on('authorized', function(authLevel){
		console.log('Authorized Level: '+authLevel);
		dataStore1.authorized = authLevel;
		JSE.dbAuthenticated = true;
	});
	blockStore1.on('authorized', function(authLevel){
		console.log('Authorized Level: '+authLevel);
		blockStore1.authorized = authLevel;
		JSE.dbAuthenticated = true;
	});
	adxStore1.on('authorized', function(authLevel){
		console.log('Authorized Level: '+authLevel);
		adxStore1.authorized = authLevel;
		JSE.dbAuthenticated = true;
	});
}
connectSockets();

function resetSockets() {
	console.log('Resetting socket connections');
	dataStore1.disconnect();
	dataStore1.destroy();
	blockStore1.disconnect();
	blockStore1.destroy();
	adxStore1.disconnect();
	adxStore1.destroy();
	connectSockets();
}

if (JSE.serverNickName && JSE.serverNickName.indexOf('load') > -1) {
	setInterval(function() {
		resetSockets();
	}, 10800000); // 3hrs for load servers
}

const jseDB = {

/** Primary Database Commands Being Sent Via Socket.io */

	/**
	 * @method <h2>setVariable</h2>
	 * @description Set or update a standard variable
	 * @param {string} key firebase style key
	 * @param {string/object/number/boolean} value can be a string, object, boolean, number anything that can be handled by JS & JSON.
	 */
	setVariable (key,value) {
		if (dataStore1.authorized > 8) {
			//fs.appendFileSync('redislog.txt', 'setVariable '+key+"\n");
			if (JSE.jseTestNet) console.log('Setting Variable: '+key);
			if (key.substring(0,10) === 'blockChain') {
				blockStore1.emit('setVariable', key, value);
			} else if (key.substring(0,3) === 'adx') {
				adxStore1.emit('setVariable', key, value);
			} else {
				dataStore1.emit('setVariable', key, value);
			}
		}
	},

	/**
	 * @method <h2>getVariable</h2>
	 * @description Creates a snapshot of the object at key and fires a callback with the object as it's argument
	 * @param {string} key firebase style key
	 * @param {function} callback calls back null if not found, otherwise object at key is passed to callback
	 */
	getVariable (key,callback) {
		if (dataStore1.authorized > 5) {
			//fs.appendFileSync('redislog.txt', 'getVariable '+key+"\n");
			if (JSE.jseTestNet) console.log('getting keyPath: '+key);
			if (key.substring(0,10) === 'blockChain') {
				blockStore1.emit('getVariable', key, function(reply){
					if (callback && typeof callback === 'function') {
						callback(reply);
					}
				});
			} else if (key.substring(0,3) === 'adx') {
				adxStore1.emit('getVariable', key, function(reply){
					if (callback && typeof callback === 'function') {
						callback(reply);
					}
				});
			} else {
				dataStore1.emit('getVariable', key, function(reply){
					if (callback && typeof callback === 'function') {
						callback(reply);
					}
				});
			}
		}
	},

	/**
	 * @method <h2>asyncGetVar</h2>
	 * @description Async await version of getVariable
	 */
	asyncGetVar(key) {
		if (dataStore1.authorized > 5) {
			if (JSE.jseTestNet) console.log('async getting keyPath: '+key);
			return new Promise((resolve) => {
				if (key.substring(0,10) === 'blockChain') {
					blockStore1.emit('getVariable', key, function(reply){
						resolve(reply);
					});
				} else if (key.substring(0,3) === 'adx') {
					adxStore1.emit('getVariable', key, function(reply){
						resolve(reply);
					});
				} else {
					dataStore1.emit('getVariable', key, function(reply){
						resolve(reply);
					});
				}
			});
		}
		return false;
	},

	/**
	 * @method <h2>asyncSetVar</h2>
	 * @description Async await version of setVariableThen
	 */
	asyncSetVar(key,value) {
		if (dataStore1.authorized > 8) {
			if (JSE.jseTestNet) console.log('async setting keyPath: '+key);
			return new Promise((resolve) => {
				if (key.substring(0,10) === 'blockChain') {
					blockStore1.emit('setVariableThen', key, value, function(){
						resolve(true);
					});
				} else if (key.substring(0,3) === 'adx') {
					adxStore1.emit('setVariableThen', key, value, function(){
						resolve(true);
					});
				} else {
					dataStore1.emit('setVariableThen', key, value, function(){
						resolve(true);
					});
				}
			});
		}
		return false;
	},


	/**
	 * @method <h2>setVariableThen</h2>
	 * @description Set or update a standard variable then fire a blank callback
	 * @param {string} key firebase style key
	 * @param {string/object/number/boolean} value can be a string, object, boolean, number anything that can be handled by JS & JSON.
	 * @param {function} callback fires after successful setting or updating of key
	 */
	setVariableThen (key,value,callback) {
		if (dataStore1.authorized > 8) {
			//fs.appendFileSync('redislog.txt', 'setThenVariable '+key+"\n");
			if (JSE.jseTestNet) console.log('SetVariableThening : '+key);
			if (key.substring(0,10) === 'blockChain') {
				blockStore1.emit('setVariableThen', key, value, function(){
					if (callback && typeof callback === 'function') {
						callback();
					}
				});
			} else if (key.substring(0,3) === 'adx') {
				adxStore1.emit('setVariableThen', key, value, function(){
					if (callback && typeof callback === 'function') {
						callback();
					}
				});
			} else {
				dataStore1.emit('setVariableThen', key, value, function(){
					if (callback && typeof callback === 'function') {
						callback();
					}
				});
			}
		}
	},

	/**
	 * @method <h2>pushVariable</h2>
	 * @description Create a push reference and then use the pushRef as a key to set variable. Push references are timestamps followed by a random number creating a unique chronologically ordered list
	 * @param {string} keyRaw firebase style key
	 * @param {string/object/number/boolean} value can be a string, object, boolean, number anything that can be handled by JS & JSON.
	 * @param {function} callback fires after successful pushing of the variable using the pushRef as an argument
	 */
	pushVariable (keyRaw,value,callback) {
		let key = keyRaw;
		if (dataStore1.authorized > 8) {
			//fs.appendFileSync('redislog.txt', 'pushVariable '+key+"\n");
			const newDate = new Date().getTime();
			const random = Math.floor((Math.random() * 999999) + 1); // setting up a firebase style push variable, timestamp+random
			const pushRef = String(newDate) +''+ String(random);
			if (key.slice(-1) === '/') { key = key.slice(0, -1); }
			key += '/'+pushRef;
			if (JSE.jseTestNet) console.log('Pushing Variable: '+key);
			if (key.substring(0,10) === 'blockChain') {
				blockStore1.emit('setVariableThen', key, value, function(){
					if (callback && typeof callback === 'function') {
						callback(pushRef);
					}
				});
			} else if (key.substring(0,3) === 'adx') {
				adxStore1.emit('setVariableThen', key, value, function(){
					if (callback && typeof callback === 'function') {
						callback(pushRef);
					}
				});
			} else {
				dataStore1.emit('setVariableThen', key, value, function(){
					if (callback && typeof callback === 'function') {
						callback(pushRef);
					}
				});
			}
		}
	},

	/**
	 * @method <h2>deleteVariable</h2>
	 * @description Delete variable at key. This is not a hard delete and will leave the key in place as key = {};
	 * @param {string} key firebase style key
	 */
	deleteVariable (key) {
		if (dataStore1.authorized > 8) {
			//fs.appendFileSync('redislog.txt', 'deleteVariable '+key+"\n");
			if (JSE.jseTestNet) console.log('Deleting : '+key);
			if (key.substring(0,10) === 'blockChain') {
				blockStore1.emit('deleteVariable', key);
			} else if (key.substring(0,3) === 'adx') {
				adxStore1.emit('deleteVariable', key);
			} else {
				dataStore1.emit('deleteVariable', key);
			}
		}
	},

	/**
	 * @method <h2>hardDeleteVariable</h2>
	 * @description Delete variable at key. This is a hard delete that will remove the key and value
	 * @param {string} key firebase style key
	 */
	hardDeleteVariable (key) {
		if (dataStore1.authorized > 8) {
			//fs.appendFileSync('redislog.txt', 'deleteVariable '+key+"\n");
			if (JSE.jseTestNet) console.log('Deleting : '+key);
			if (key.substring(0,10) === 'blockChain') {
				blockStore1.emit('hardDeleteVariable', key);
			} else if (key.substring(0,3) === 'adx') {
				adxStore1.emit('hardDeleteVariable', key);
			} else {
				dataStore1.emit('hardDeleteVariable', key);
			}
		}
	},

	/**
	 * @method <h2>plusX</h2>
	 * @description Add value x to the value stored in key
	 * @param {string} key firebase style key
	 * @param {number} x amount to increase the value of key by
	 */
	plusX(key,x) {
		if (dataStore1.authorized > 8) {
			//fs.appendFileSync('redislog.txt', 'plusX '+key+' '+x+"\n");
			if (JSE.jseTestNet) console.log('Plus Xing : '+key+' : '+x);
			if (key.substring(0,10) === 'blockChain') {
				blockStore1.emit('plusX', key, x);
			} else if (key.substring(0,3) === 'adx') {
				adxStore1.emit('plusX', key, x);
			} else {
				dataStore1.emit('plusX', key, x);
			}
		}
	},

	/**
	 * @method <h2>storeFile</h2>
	 * @description Async await version of setVariableThen
	 */
	storeFile(key,fileName,data,encoding) {
		if (dataStore1.authorized > 8) {
			if (JSE.jseTestNet) console.log('storingFile: '+key+'-'+fileName);
			if (key.substring(0,3) === 'adx') {
				adxStore1.emit('storeFile', key,fileName,data,encoding);
			}
		}
		return false;
	},

	/**
	 * @method <h2>backup</h2>
	 * @description Backup command, in place but not used
	 */
	backup() {
		if (dataStore1.authorized > 8) {
			if (JSE.jseTestNet) console.log('Sending Backup Command');
			blockStore1.emit('backup');
			dataStore1.emit('backup');
			adxStore1.emit('backup');
		}
	},

	/**
	 * @method <h2>closeConnection</h2>
	 * @description Close the socket connection to the data store, not used
	 */
	closeConnection() {
		if (dataStore1.authorized > 8) {
			if (JSE.jseTestNet) console.log('Closing Datastore Connection');
			blockStore1.close();
			dataStore1.close();
			adxStore1.close();
		}
	},

	/** Secondary commands and functions, not core to the database */

	/**
	 * @method <h2>genSafeKey</h2>
	 * @description Cleans a string to make sure it is safe to use as a firebase key
	 * @param {string} unsafeString string that can contain bad characters
	 * @returns {string} safeKey returns a safe key which is just a-zA-Z0-9
	 */
	genSafeKey(unsafeString) {
		const safeKey = String(unsafeString).split(/[^a-zA-Z0-9]/).join('').slice(0,100);
		return safeKey;
	},

	/**
	 * @method <h2>checkExists</h2>
	 * @description Checks to see if there is a value at key, returns true/false
	 * @param {string} key firebase style key
	 * @returns {boolean} if value is null or undefined returns false, otherwise returns true
	 */
	checkExists (key,callback) {
		JSE.jseDataIO.getVariable(key,function(reply) {
			//console.log('### '+typeof reply+' / '+reply);
			if (typeof reply === 'undefined' || reply === null) {
				callback(false);
			} else {
				callback(true);
			}
		});
	},

	/**
	 * @method <h2>countValues</h2>
	 * @description Count number of pushed keys that match the value at key
	 * @param {string} key firebase style key
	 * @param {string/object/number/boolean} value can be a string, object, boolean, number anything that can be handled by JS & JSON.
	 * @param {function} callback callsback 0 or the number of values that match
	 */
	countValues (key,value,callback) {
		JSE.jseDataIO.getVariable(key,function(returnObj) {
			let valueCount = 0;
			if (typeof returnObj !== 'undefined') {
				Object.keys(returnObj).forEach(function(key2) {
				//for (let key in returnObj) {
					//if (!returnObj.hasOwnProperty(key)) continue;
					if (returnObj[key2] === value) valueCount +=1;
				});
				callback(valueCount);
			} else {
				callback(0);
			}
		});
	},

	/**
	 * @method <h2>plusOne</h2>
	 * @description Plus one to key
	 * @param {string} key firebase style key, used for quick additions for stats etc
	 */
	plusOne(key) {
		JSE.jseDataIO.plusX(key,1);
	},

	/**
	 * @method <h2>minusX</h2>
	 * @description Removes value x from the value at key, even if a possitive figure is passed to x it is turned negative
	 * @param {string} key firebase style key, used for quick additions for stats etc
	 * @param {number} xRaw number is multiplied by -1 to ensure negative and then added to value at key
	 */
	minusX(key,xRaw) {
		let x = xRaw;
		if (x > 0) { x *= -1; } // turn negative
		JSE.jseDataIO.plusX(key,x);
	},

	/**
	 * @method <h2>buildLedger</h2>
	 * @description Build an accounts ledger just by calling getVariable('ledger');
	 * @param {function} callback callback with the ledger object
	 */
	buildLedger(callback) {
		JSE.jseDataIO.getVariable('ledger',function(reply) {
			callback(reply);
		});
	},

	/**
	 * @method <h2>newBlockID</h2>
	 * @description +1 to the current block ID
	 * @param {function} callback callback with the next blockID
	 */
	newBlockID(callback) {
		JSE.jseDataIO.getVariable('blockID',function(bID) {
			const bID2 = (bID || 0) + 1;
			JSE.jseDataIO.setVariableThen('blockID',bID2,function() {
				callback(bID2);
			});
		});
	},

	/**
	 * @method <h2>saveNewBlock</h2>
	 * @description Saves a block object to the next blockID
	 * @param {object} newBlock block object built in jseBlockChain
	 * @param {function} callback fires a blank callback once the block has been saved
	 */
	saveNewBlock(newBlock,callback) {
		const nextBlock = JSE.blockID + 1; // relies on blockID being global and updated
		const blockRef = JSE.jseDataIO.getBlockRef(nextBlock);
		if (JSE.blockID >= 0) {
			JSE.jseDataIO.setVariableThen('blockChain/'+blockRef+'/'+nextBlock,newBlock,function() {
				callback();
			});
		}
	},

	/**
	 * @method <h2>pushBlockData</h2>
	 * @description Push BlockData to the current block. Contains a check to see if it's open for writing.
	 * @param {object} blockData transaction data to push into blockchain
	 * @param {function} callback callback with the blockData
	 */
	pushBlockData(blockDataRaw,callback) {
		const blockData = blockDataRaw;
		JSE.jseDataIO.getVariable('blockID',function(latestBlockID) {
			JSE.blockID = latestBlockID; // update JSE.blockID as we have the data
			if (blockData.command && blockData.command !== 'mining') {
				blockData.blockID = latestBlockID; // store blockID in tranasction
			}
			const blockRef = JSE.jseDataIO.getBlockRef(latestBlockID);
			JSE.jseDataIO.getVariable('blockChain/'+blockRef+'/'+latestBlockID+'/open',function(trueFalse) {
				if (trueFalse === true) {
					JSE.jseDataIO.pushVariable('blockChain/'+blockRef+'/'+latestBlockID+'/input',blockData,function(pushRef) {
						if (blockData.command && blockData.command !== 'mining') {
							blockData.tx = pushRef;
							JSE.jseDataIO.setVariable('blockChain/'+blockRef+'/'+latestBlockID+'/input/'+pushRef+'/tx',pushRef); // set tx to pushRef for blockchain explorer lookup
						}

						callback(blockData);
					});
				} else {
					console.log('Warning 346 changing block ('+latestBlockID+') command: '+blockData.command);
					setTimeout(function() { JSE.jseDataIO.pushBlockData(blockData,callback); }, 3000); // Might be changing block, try again in a couple of seconds
				}
			});
		});
	},

	/**
	 * @method <h2>getBlock</h2>
	 * @description Get the block object at blockNumber
	 * @param {number} blockNumberRaw blockID to lookup
	 * @param {function} callback callback with the blockData
	 */
	getBlock(blockNumberRaw,callback) {
		let blockNumber = blockNumberRaw;
		if (blockNumber < 1) { blockNumber = 1; }
		const blockRef = JSE.jseDataIO.getBlockRef(blockNumber);
		JSE.jseDataIO.getVariable('blockChain/'+blockRef+'/'+blockNumber,function(blockObject) {
			callback(blockObject);
		});
	},

	/**
	 * @method <h2>solvedBlock</h2>
	 * @description Set the solved nonce and hash for a block
	 * @param {number} blockIDMinusTwoRaw blockID to set solved hash for is two behind current block ID
	 * @param {string} nonce random number found by miners to solve the block
	 * @param {string} hash hash with leading zeros finalizes the block
	 */
	solvedBlock(blockIDMinusTwoRaw,nonce,hash) {
		let blockIDMinusTwo = blockIDMinusTwoRaw;
		if (blockIDMinusTwo < 1) { blockIDMinusTwo = 1; }
		const blockRef = JSE.jseDataIO.getBlockRef(blockIDMinusTwo);
		JSE.jseDataIO.setVariable('blockChain/'+blockRef+'/'+blockIDMinusTwo+'/nonce',nonce);
		JSE.jseDataIO.setVariable('blockChain/'+blockRef+'/'+blockIDMinusTwo+'/hash',hash);
		if (JSE.blockID > 0) {
			const blockIDMinusOne = blockIDMinusTwo + 1;
			const blockRef2 = JSE.jseDataIO.getBlockRef(blockIDMinusOne);
			JSE.jseDataIO.setVariable('blockChain/'+blockRef2+'/'+blockIDMinusOne+'/previousHash',hash);
		}
	},

	/**
	 * @method <h2>getBlockRef</h2>
	 * @description Get the blockReference for a block id i.e. blockID 123456 = blockRef 123
	 * @param {number} blockNumber blockID to lookup
	 * @returns {number} blockRef basically a rounded down / 1000 which acts as a key for blockChain
	 */
	getBlockRef(blockNumber) {
		let blockRef = Math.round((blockNumber - (JSE.jseSettings.maxBlockFileSize/2)) / (JSE.jseSettings.maxBlockFileSize));
		if (blockRef < 0) { blockRef = 0; }
		return blockRef;
	},

	/** Platform Data Commands */

	/**
	 * @method <h2>checkUniqueEmail</h2>
	 * @description Check to see if email exists in DB
	 * @param {object} userObject user object, only user.email is required though
	 * @param {function} callback callsback the user object if successful and email is not in data
	 * @param {function} failcallback callsback fail JSON if email already exists
	 */
	checkUniqueEmail(userObject,callback,failCallback) {
		JSE.jseDataIO.checkExists('lookupEmail/'+userObject.email,function(trueFalse) {
			if (trueFalse === false) {
				callback(userObject);
			} else {
				failCallback('{"fail":1,"notification":"Email already exists in database"}');
			}
		});
	},

	/**
	 * @method <h2>reserveUID</h2>
	 * @description Reserve a uid, an icremental user id, test we have exclusive access in addUser
	 * @param {object} userObjectRaw user object
	 * @param {function} callback callsback the user object with an added userObject.uid field
	 */
	reserveUID(userObjectRaw,callback) {
		const userObject = userObjectRaw;
		JSE.jseDataIO.getVariable('nextUserID',function(nextUID) {
			const nextUID2 = nextUID + 1;
			JSE.jseDataIO.setVariableThen('nextUserID',nextUID2,function() {
				userObject.uid = nextUID;
				JSE.jseDataIO.checkExists('credentials/'+userObject.uid+'/email',function(trueFalse) { // check it's empty
					if (trueFalse === false) {
						JSE.jseDataIO.setVariable('credentials/'+userObject.uid+'/uid',userObject.uid);
						JSE.jseDataIO.setVariableThen('credentials/'+userObject.uid+'/email',userObject.email,function() {
							callback(userObject);
						});
					} else {
						JSE.jseDataIO.reserveUID(userObject,callback);
					}
				});
			});
		});
	},

	/**
	 * @method <h2>addUser</h2>
	 * @description Add a new user to platform datastore
	 * @param {object} userObjectRaw user object
	 * @param {function} callback callsback the user object on successful user account setup
	 * @param {function} failcallback callsback fail JSON if email already exists
	 */
	addUser(userObjectRaw,callback,failCallback) {
		const userObject = userObjectRaw;
		// check users/uid/email hasn't been overwritten by duplicate entry
		JSE.jseDataIO.getVariable('credentials/'+userObject.uid+'/email',function(testEmail) {
			if (testEmail === userObject.email) {
				// start building out user data
				JSE.jseDataIO.setVariable('ledger/'+userObject.uid,0); // No money, no honey
				const credentials = {};
				credentials.uid = userObject.uid;
				credentials.email = userObject.email;
				credentials.passwordHashed = userObject.passwordHashed;
				credentials.apiKey = userObject.apiKey;
				credentials.apiLevel = userObject.apiLevel;
				credentials.privateKey = userObject.privateKey;
				credentials.publicKey = userObject.publicKey;
				//JSE.jseDataIO.setVariable('users/'+userObject.uid+'/k',userObject.publicKey);
				credentials.confirmCode = userObject.confirmCode;
				credentials.authKey = userObject.authKey;
				credentials.twoFactorAuth = userObject.twoFactorAuth;
				credentials.session = userObject.session;
				JSE.jseDataIO.setVariable('credentials/'+userObject.uid,credentials);

				const account = {};
				account.uid = userObject.uid;
				account.email = userObject.email;
				account.publicKey = userObject.publicKey;
				account.name = userObject.name;
				account.address = userObject.address;
				account.invested = 0;
				//JSE.jseDataIO.setVariable('investors/'+userObject.uid,0);
				account.country = userObject.country;
				account.source = userObject.source;
				account.campaign = userObject.campaign;
				account.content = userObject.content;
				account.jseUnique = userObject.jseUnique;
				account.regip = userObject.regip;
				account.lastip = userObject.lastip;
				account.localcurrency = userObject.localcurrency;
				account.registrationDate = userObject.registrationDate;
				account.lastLogin = userObject.registrationDate;
				account.confirmed = userObject.confirmed;
				//account.lastLogin = userObject.lastLogin;
				account.geo = userObject.geo;
				account.language = userObject.language;
				account.timeOffset = userObject.timeOffset;
				// account.affQuality and account.affPayout will go here only for users that need it.

				JSE.jseDataIO.setVariable('account/'+userObject.uid,account);

				userObject.statsTotal = {}; // Going to be a lot of this data so shortened keys
				userObject.statsTotal.h = 0; // hit
				userObject.statsTotal.u = 0; // unique
				userObject.statsTotal.o = 0; // optin
				userObject.statsTotal.a = 0; // hash
				userObject.statsTotal.c = 0; // coin
				JSE.jseDataIO.setVariable('statsTotal/'+userObject.uid,userObject.statsTotal);

				userObject.statsToday = {};
				userObject.statsToday.h = 0;
				userObject.statsToday.u = 0;
				userObject.statsToday.o = 0;
				userObject.statsToday.a = 0;
				userObject.statsToday.c = 0;
				JSE.jseDataIO.setVariable('statsToday/'+userObject.uid,userObject.statsToday);

				// For quick registration and duplicate checks
				const tmpObj = {}; tmpObj.i = userObject.regip;
				JSE.jseDataIO.pushVariable('registeredIPs',tmpObj,function(pushRef){});
				const tmpObj2 = {}; tmpObj2.i = userObject.jseUnique;
				JSE.jseDataIO.pushVariable('registeredUniques',tmpObj2,function(pushRef){});

				//const tmpObj3 = {}; tmpObj3.i = userObject.email;
				//JSE.jseDataIO.pushVariable('registeredEmails',tmpObj,function(pushRef){});
				JSE.jseDataIO.setVariable('lookupExports/'+credentials.uid,{});
				JSE.jseDataIO.setVariable('lookupEmail/'+userObject.email,userObject.uid);
				JSE.jseDataIO.setVariable('lookupSession/'+userObject.session,userObject.uid);
				JSE.jseDataIO.setVariable('lookupPublicKey/'+userObject.publicKey,userObject.uid);
				JSE.jseDataIO.setVariable('lookupAPIKey/'+userObject.apiKey,userObject.uid);
				JSE.jseDataIO.setVariable('history/'+credentials.uid,{});
				JSE.jseDataIO.setVariable('mining/'+credentials.uid,{});
				JSE.jseDataIO.setVariable('statsTotal/'+credentials.uid,{});
				JSE.jseDataIO.setVariable('siteIDs/'+credentials.uid,{});
				JSE.jseDataIO.setVariable('subIDs/'+credentials.uid,{});
				callback(userObject);
			} else {
				failCallback('{"fail":1,"notification":"Server could not assign a unique identifier, please try again"}');
			}
		});
	},

	/**
	 * @method <h2>checkDuplicate</h2>
	 * @description Check if user IP or jseUnique const is in database already
	 * @param {object} userObject user object, only userObject.regip and userObject.jseUniuqe are used
	 * @param {function} callback callsback the user object if the ip and uniq haven't been seen before
	 * @param {function} failcallback blank callback if it's a duplicate account
	 */
	checkDuplicate(userObject,callback,failCallback) {
		JSE.jseDataIO.countSubValues('registeredIPs',userObject.regip, function(ipCount) {
			if (ipCount <= 1) { // just the user that's already been added to db
				JSE.jseDataIO.countSubValues('registeredUniques',userObject.jseUnique, function(uniqueCount) {
					if (uniqueCount <= 1) {
						callback(userObject);
					} else {
						failCallback();
					}
				});
			} else {
				failCallback();
			}
		});
	},

	/**
	 * @method <h2>getEmail</h2>
	 * @description Lookup email address from UID
	 * @param {number} uid User ID
	 * @param {function} callback callsback with the users email
	 */
	getEmail(uid,callback) {
		JSE.jseDataIO.getVariable('account/'+uid+'/email',function(email) {
			callback(email);
		});
	},

	/**
	 * @method <h2>checkSuspended</h2>
	 * @description Check if a UID has been suspended
	 * @param {number} uid User ID
	 * @param {function} callback callsback with the users email
	 */
	checkSuspended(uid,callback) {
		JSE.jseDataIO.getVariable('account/'+uid+'/suspended',function(suspended) {
			callback(suspended);
		});
	},

	/** Login Functions */

	/**
	 * @method <h2>getCredentialsByPassword</h2>
	 * @description  Return full credentials object including uid with an email password
	 * @param {string} email Users email address, should be already converted to lowercase and cleaned
	 * @param {string} passwordHashed Users password, should already be hashed
	 * @param {function} callback callsback with the users credentials object
	 * @param {function} failcallback blank callback if it's not a valid user:pass
	 */
	getCredentialsByPassword(email,passwordHashed,callback,failCallback) {
		JSE.jseDataIO.lookupEmail(email,function(uid){
			if (uid == null) {
				if (typeof failCallback === 'function') failCallback();
				return false;
			}
			JSE.jseDataIO.getVariable('credentials/'+uid,function(credentials) {
				if (credentials.email === email && credentials.passwordHashed === passwordHashed) {
					callback(credentials);
				} else if (typeof failCallback === 'function') {
					failCallback(); // password doesn't match
				}
				return false;
			});
			return false;
		});
	},

	/**
	 * @method <h2>getCredentialsBySession</h2>
	 * @description  Return full credentials object including uid with a session key.<br>
	 * 							 We now have 3 different session keys for platform, desktop app and mobile app.<br>
	 *							 Each can be used simultaneously to login at the same time.
	 * @param {string} session Users session key
	 * @param {function} callback callsback with the users credentials object
	 * @param {function} failcallback blank callback if it's not a valid session key
	 */
	getCredentialsBySession(session,callback,failCallback) {
		JSE.jseDataIO.lookupSession(session,function(uid){
			if (uid == null) {
				if (typeof failCallback === 'function') failCallback();
				return false;
			}
			JSE.jseDataIO.getVariable('credentials/'+uid,function(credentials) {
				if (credentials == null) {
					if (typeof failCallback === 'function') failCallback();
					return false;
				}
				if (credentials.session !== session && credentials.mobileSession !== session && credentials.desktopSession !== session) {
					if (typeof failCallback === 'function') failCallback();
					return false;
				}
				callback(credentials);
				return false;
			});
			return false;
		});
	},

	/**
	 * @method <h2>getCredentialsByAPIKey</h2>
	 * @description  Return full credentials object with an API key.
	 * @param {string} apiKey Users api key
	 * @param {function} callback callsback with the users credentials object
	 * @param {function} failcallback blank callback if it's not a valid api key
	 */
	getCredentialsByAPIKey(apiKey,callback,failCallback) {
		JSE.jseDataIO.lookupAPIKey(apiKey,function(uid){
			if (uid == null) {
				if (typeof failCallback === 'function') failCallback();
				return false;
			}
			JSE.jseDataIO.getVariable('credentials/'+uid,function(credentials) {
				if (credentials == null) {
					if (typeof failCallback === 'function') failCallback();
					return false;
				}
				if (credentials.apiKey !== apiKey) {
					if (typeof failCallback === 'function') failCallback();
					return false;
				}
				callback(credentials);
				return false;
			});
			return false;
		});
	},

	/**
	 * @method <h2>getCredentialsByUID</h2>
	 * @description Return full credentials object with uid variable - no checks, internal use only
	 * @param {number} uid User ID
	 * @param {function} callback callsback with the users credentials object
	 * @todo Could there be a more elegant way to do this with better security? Pass a credentials key perhaps.
	 */
	getCredentialsByUID(uid,callback) {
		JSE.jseDataIO.getVariable('credentials/'+uid,function(credentials) {
			callback(credentials);
		});
	},

	/**
	 * @method <h2>getUserData</h2>
	 * @description Return full credentials object with session variable
	 * @param {object} credentials Users credentials object, including credentials.uid which is used for lookups
	 * @param {function} callback callsback with the full user object including:<br>
	 * account, credentials, statsTotal, statsToday, ledger, history, mining, merchantSales, merchantPurchases
	 */
	getUserData(credentials,callback) {
		JSE.jseDataIO.getVariable('account/'+credentials.uid,function(accountRaw) {
			const account = accountRaw;
			account.uid = credentials.uid;
			account.session = credentials.session;
			account.desktopSession = credentials.desktopSession || null;
			account.mobileSession = credentials.mobileSession || null;
			account.apiKey = credentials.apiKey.substring(0, 10); // only show public part of API Key
			account.apiLevel = credentials.apiLevel;
			account.privateKey = credentials.privateKey;
			account.twoFactorAuth = credentials.twoFactorAuth;
			account.txLimit = credentials.txLimit || JSE.jseSettings.txLimit || 2000;
			if (!credentials.pin) {
				account.requirePin = true;
			}
			JSE.jseDataIO.getVariable('statsTotal/'+credentials.uid,function(statsTotal) {
				account.statsTotal = statsTotal;
				JSE.jseDataIO.getVariable('statsToday/'+credentials.uid,function(statsToday) {
					account.statsToday = statsToday;
					JSE.jseDataIO.getVariable('ledger/'+credentials.uid,function(balance) {
						account.balance = balance;
						JSE.jseDataIO.getVariable('rewards/'+credentials.uid,function(rewards) {
							account.rewards = rewards;
							JSE.jseDataIO.getVariable('history/'+credentials.uid,function(history) {
								account.history = history;
								JSE.jseDataIO.getVariable('mining/'+credentials.uid,function(mining) {
									account.mining = mining;
									if (typeof account.merchant === 'undefined') {
										callback(account);
									} else {
										JSE.jseDataIO.getVariable('merchantSales/'+credentials.uid,function(merchantSales) {
											account.merchantSales = merchantSales;
											JSE.jseDataIO.getVariable('merchantPurchases/'+credentials.uid,function(merchantPurchases) {
												account.merchantPurchases = merchantPurchases;
												callback(account);
											}); // merchantPurchases
										}); // merchantSales
									}
								}); // mining
							}); // history
						}); // rewards
					}); // ledger/balance
				}); // statsToday
			}); // statsTotal
		}); //account
	},

	/**
	 * @method <h2>getUserByEmail</h2>
	 * @description Return a mini user object with email,uid,publicKey from the users email
	 * @param {string} email Email to lookup
	 * @param {function} callback callback with mini user object
	 * @param {function} failCallback blank callback if email doesn't exist
	 */
	getUserByEmail(email,callback,failCallback) {
		JSE.jseDataIO.lookupEmail(email,function(uid) {
			if (uid == null) { failCallback(); return false; }
			JSE.jseDataIO.getVariable('credentials/'+uid, function(returnObj) {
				if (returnObj === null) {
					failCallback();
					return false;
				}
				const userObj = {};
				userObj.email = returnObj.email;
				userObj.uid = returnObj.uid;
				userObj.publicKey = returnObj.publicKey;
				callback(userObj);
				return false;
			});
			return false;
		});
	},

	/**
	 * @method <h2>lookupEmail</h2>
	 * @description Give an email address get a userID or null if it doesn't exist
	 * @param {string} email Email to lookup
	 * @param {function} callback callback with uid or null
	 */
	lookupEmail(email,callback) {
		JSE.jseDataIO.getVariable('lookupEmail/'+email,function(uid) {
			callback(uid);
		});
	},

	/**
	 * @method <h2>lookupSession</h2>
	 * @description Give a session key get a userID or null if it doesn't exist
	 * @param {string} session Session key to lookup
	 * @param {function} callback callback with uid or null
	 */
	lookupSession(session,callback) {
		JSE.jseDataIO.getVariable('lookupSession/'+session,function(uid) {
			callback(uid);
		});
	},

	/**
	 * @method <h2>lookupPublicKey</h2>
	 * @description Give a public key get a userID or null if it doesn't exist
	 * @param {string} publicKey Public key to lookup
	 * @param {function} callback callback with uid or null
	 */
	lookupPublicKey(publicKey,callback) {
		JSE.jseDataIO.getVariable('lookupPublicKey/'+publicKey,function(uid) {
			callback(uid);
		});
	},

	/**
	 * @method <h2>lookupAPIKey</h2>
	 * @description Give an API key get a userID or null if it doesn't exist
	 * @param {string} apiKey API key to lookup
	 * @param {function} callback callback with uid or null
	 */
	lookupAPIKey(apiKey,callback) {
		JSE.jseDataIO.getVariable('lookupAPIKey/'+apiKey,function(uid) {
			callback(uid);
		});
	},

	/**
	 * @method <h2>setupNewTransaction</h2>
	 * @description Set a transaction reference and create a unique transaction id
	 * @param {string} reference is a transfer reference that the user wants to store privately offchain
	 * @param {function} callback callback with pushRef for the transaction refererence
	 */
	setupNewTransaction(reference,callback) {
		JSE.jseDataIO.pushVariable('transactions',reference,function(pushRef) {
			callback(pushRef);
		});
	},

	/**
	 * @method <h2>checkUserByPublicKey</h2>
	 * @description Lookup uid,balance,locked,suspended,email by publicKey
	 * @param {string} publicKey users public key
	 * @param {function} callback callback with userObject filled from getUserByUID, plus checks for ledger,locked and suspended
	 * @param {function} failCallback blank callback if publicKey isn't recognized
	 */
	checkUserByPublicKey(publicKey,callback,failCallback) {
		JSE.jseDataIO.lookupPublicKey(publicKey,function(uid) {
			if (typeof uid === 'undefined' || uid === null) {
				failCallback();
			} else {
				JSE.jseDataIO.getUserByUID(uid,function(userObjRaw) {
					const userObj = userObjRaw;
					JSE.jseDataIO.getVariable('ledger/'+userObj.uid,function(balance) {
						userObj.balance = JSE.jseFunctions.round(balance);
						JSE.jseDataIO.getVariable('locked/'+userObj.uid,function(locked) {
							if (locked == null) { userObj.locked = false; } else { userObj.locked = true; }
							JSE.jseDataIO.getVariable('credentials/'+userObj.uid,function(credentials) {
								if (credentials.suspended == null || credentials.suspended === 0) { userObj.suspended = false; } else { userObj.suspended = true; }
								userObj.txLimit = credentials.txLimit;
								callback(userObj);
							});
						});
					});
				});
			}
		});
	},

	/**
	 * @method <h2>getUserByPublicKey</h2>
	 * @description Lookup user object by public key, userObject filled from getUserByUID
	 * @param {string} publicKey users public key
	 * @param {function} callback callback with userObject
	 * @param {function} failCallback blank callback if publicKey isn't recognized
	 */
	getUserByPublicKey(publicKey,callback,failCallback) {
		JSE.jseDataIO.lookupPublicKey(publicKey,function(uid) {
			if (uid === null)  { failCallback(); return false; }
			JSE.jseDataIO.getUserByUID(uid,function(userObj) {
				callback(userObj);
			});
			return false;
		});
	},

	/**
	 * @method <h2>getUserByUID</h2>
	 * @description Lookup mini user object uid,email,publicKey
	 * @param {number} uid users ID
	 * @param {function} callback callback with mini userObject
	 * @param {function} failCallback blank callback if publicKey isn't recognized
	 */
	getUserByUID(uid,callback,failCallback) { // 6th March 2018 no failcallback function executed???
		JSE.jseDataIO.getVariable('credentials/'+uid,function(returnObj) {
			if (returnObj === null) {
				failCallback();
				return false;
			}
			const userObj = {};
			userObj.uid = returnObj.uid;
			userObj.email = returnObj.email;
			userObj.publicKey = returnObj.publicKey;
			callback(userObj);
			return false;
		});
	},

	/**
	 * @method <h2>addBalance</h2>
	 * @description Add to a users JSE balance, only affects ledger, blockchain must have data pushed separately
	 * @param {number} uid users ID
	 * @param {number} x amount to increase by
	 */
	addBalance(uid,x) {
		JSE.jseDataIO.plusX('ledger/'+uid,x);
	},

	/**
	 * @method <h2>minusBalance</h2>
	 * @description Reduce a users JSE balance, only affects ledger, blockchain must have data pushed separately
	 * @param {number} uid users ID
	 * @param {number} x amount to decrease by
	 */
	minusBalance(uid,x) {
		JSE.jseDataIO.minusX('ledger/'+uid,x);
	},

	/**
	 * @method <h2>getTransactionReference</h2>
	 * @description Lookup the transaction reference for a particular tid, tid = timstampRandom thing
	 * @param {number} tid Transaction ID (pushRef)
	 * @param {function} callback callsback with the private transaction reference string
	 */
	getTransactionReference(tid,callback) {
		JSE.jseDataIO.getVariable('transactions/'+tid, function(transactionReference) {
			callback(transactionReference);
		});
	},

	/**
	 * @method <h2>checkCredentialsByAPIKey</h2>
	 * @description Check Credentials including locked, suspended accounts with an API key
	 * @param {string} apiKey API Key
	 * @param {function} callback callsback the user object
	 * @param {function} failCallback callsback blank if API key is not valid
	 */
	checkCredentialsByAPIKey(apiKey,callback,failCallback) {
		JSE.jseDataIO.lookupAPIKey(apiKey, function(uid) {
			if (uid === null || typeof uid === 'undefined') {
				failCallback();
			} else {
				const userObj = {};
				userObj.uid = uid;
				JSE.jseDataIO.getVariable('credentials/'+userObj.uid+'/apiLevel',function(apiLevel) {
					userObj.apiLevel = apiLevel;
					callback(userObj);
				});
			}
		});
	},

	/** Misc Datastore and Maintenance Functions */

	/**
	 * @method <h2>updatePublicStats</h2>
	 * @description Update the JSE.publicStats variable, this is run from the controller every 10 minutes
	 */
	updateExchangeRates: async() => {
		JSE.publicStats.exchangeRates = await jseExchanges.getExchangeRates();
		if (!JSE.publicStats.exchangeRates) return false;
		JSE.jseDataIO.setVariable('publicStats/exchangeRates',JSE.publicStats.exchangeRates);
		// update market cap
		if (JSE.publicStats.coins) { // don't update if the circulating supply hasn't completed
			JSE.publicStats.marketCap = Math.round(JSE.publicStats.coins * JSE.publicStats.exchangeRates.USDJSE);
			JSE.jseDataIO.setVariable('publicStats/marketCap',JSE.publicStats.marketCap);
		}
		return false;
	},

	/**
	 * @method <h2>addERC20Tokens</h2>
	 * @description Include ERC20 tokens in line with coinmarketcaps circulating supply criteria
	 * https://coinmarketcap.com/faq/
	 */
	addERC20Tokens: async() => {
		/*
		const coldStorageBalance = await jseEthIntegration.balanceJSE('0xc880f4143950bfb27ed021793991f35466b99201');
		const jseFundsBalance = await jseEthIntegration.balanceJSE('0x7a1f4c1031f11571a95e4778c2b4281af88c1e28');
		const foundersBalance = await jseEthIntegration.balanceJSE('0x9f8ed3820bae1d4bf6396b51df2dbf9cf0853161');
		const erc20Coins = 10000000000 - coldStorageBalance - jseFundsBalance - foundersBalance;
		*/
		//const coinTotal = JSE.publicStats.platformCoins + erc20Coins;
		const coinTotal = 443479880; // coinmarketcap total
		JSE.publicStats.coins = JSE.jseFunctions.round(coinTotal);
		JSE.jseDataIO.setVariable('publicStats/coins',JSE.publicStats.coins);
	},

	/**
	 * @method <h2>vcStats</h2>
	 * @description Additional stats such as 7day 30 day active users
	 */
	vcStats: async () => {
		const now = new Date().getTime();
		const weekAgo = now - 604800000;
		const monthAgo = now - 2628000000;
		let weekActive = 0;
		let monthActive = 0;
		const accounts = await JSE.jseDataIO.asyncGetVar('account/');
		Object.keys(accounts).forEach((uid) => {
			if (accounts[uid] && accounts[uid].lastLogin && accounts[uid].lastLogin.ts) {
				const lastLoginTS = accounts[uid].lastLogin.ts || 0;
				if (lastLoginTS > weekAgo) {
					weekActive += 1;
					console.log(accounts[uid].email);
				}
				if (lastLoginTS > monthAgo) monthActive += 1;
			}
		});
		JSE.publicStats.weekActiveUsers = weekActive;
		JSE.jseDataIO.setVariable('publicStats/weekActiveUsers',JSE.publicStats.weekActiveUsers);
		JSE.publicStats.monthActiveUsers = monthActive;
		JSE.jseDataIO.setVariable('publicStats/monthActiveUsers',JSE.publicStats.monthActiveUsers);
		//console.log(`Week Active Members: ${weekActive} - Month Active Members: ${monthActive}`);
		const yesterday = new Date(new Date().setDate(new Date().getDate()-1));
		const yesterdayYYMMDD = yesterday.toISOString().slice(2,10).replace(/-/g,"");
		const adxAdvStats = await JSE.jseDataIO.asyncGetVar('adxAdvStats/');
		let advertisers = 0;
		let adCampaigns = 0;
		let adSpend = 0;
		let adImpressions = 0;
		let adClicks = 0;
		Object.keys(adxAdvStats).forEach((uid) => {
			if (adxAdvStats[uid] && adxAdvStats[uid][yesterdayYYMMDD]) {
				advertisers += 1;
				Object.keys(adxAdvStats[uid][yesterdayYYMMDD]).forEach((campaign) => {
					const advCampaign = adxAdvStats[uid][yesterdayYYMMDD][campaign];
					adCampaigns += 1;
					if (advCampaign.j) adSpend += advCampaign.j;
					if (advCampaign.i) adImpressions += advCampaign.i;
					if (advCampaign.c) adClicks += advCampaign.c;
				});
			}
		});
		JSE.publicStats.advertisers = advertisers;
		JSE.jseDataIO.setVariable('publicStats/advertisers',JSE.publicStats.advertisers);
		JSE.publicStats.adCampaigns = adCampaigns;
		JSE.jseDataIO.setVariable('publicStats/adCampaigns',JSE.publicStats.adCampaigns);
		JSE.publicStats.adSpend = Math.round(adSpend);
		JSE.jseDataIO.setVariable('publicStats/adSpend',JSE.publicStats.adSpend);
		JSE.publicStats.adImpressions = adImpressions;
		JSE.jseDataIO.setVariable('publicStats/adImpressions',JSE.publicStats.adImpressions);
		JSE.publicStats.adClicks = adClicks;
		JSE.jseDataIO.setVariable('publicStats/adClicks',JSE.publicStats.adClicks);
	},

	/**
	 * @method <h2>updatePublicStats</h2>
	 * @description Update the JSE.publicStats variable, this is run from the controller every 10 minutes
	 */
	updatePublicStats() {
		JSE.publicStats.ts = new Date().getTime();
		JSE.jseDataIO.buildLedger(function(ledger) {
			JSE.publicStats.distributionAccount = ledger[0];
			JSE.publicStats.charityAccount = ledger[2895];
			JSE.jseDataIO.setVariable('publicStats/distributionAccount',JSE.publicStats.distributionAccount);
			JSE.jseDataIO.setVariable('publicStats/charityAccount',JSE.publicStats.charityAccount);
			let users = 0;
			let platformCoins = 0; // total circulation on JSE Ledger
			Object.keys(ledger).forEach(function(key) {
				users +=1;
				platformCoins += ledger[key];
			});
			JSE.publicStats.users = users;
			JSE.jseDataIO.setVariable('publicStats/users',JSE.publicStats.users);
			JSE.publicStats.platformCoins = JSE.jseFunctions.round(platformCoins);
			JSE.jseDataIO.setVariable('publicStats/platformCoins',JSE.publicStats.platformCoins);
			JSE.jseDataIO.addERC20Tokens();
		});
		JSE.jseDataIO.getVariable('statsToday',function(statsDaily) {
			let unique = 0;
			let hit = 0;
			let optin = 0;
			let selfMiners = 0;
			Object.keys(statsDaily).forEach(function(key) {
				if (statsDaily[key].h && statsDaily[key].h > 0) {
					hit += statsDaily[key].h;
				}
				if (statsDaily[key].u && statsDaily[key].u > 0) {
					unique += statsDaily[key].u;
				}
				if (statsDaily[key].o && statsDaily[key].o > 0) {
					optin += statsDaily[key].o;
				}
				if (statsDaily[key].a && statsDaily[key].a > 0) {
					if (!statsDaily[key].u || statsDaily[key].u === 0) {
						selfMiners +=1;
					}
				}
			});
			JSE.publicStats.hit = hit;
			JSE.publicStats.unique = unique;
			JSE.publicStats.optin = optin;
			JSE.publicStats.selfMiners = selfMiners;

			JSE.jseDataIO.setVariable('publicStats/hit',JSE.publicStats.hit);
			JSE.jseDataIO.setVariable('publicStats/unique',JSE.publicStats.unique);
			JSE.jseDataIO.setVariable('publicStats/optin',JSE.publicStats.optin);
			JSE.jseDataIO.setVariable('publicStats/selfMiners',JSE.publicStats.selfMiners);
		});

		if (Math.random() > 0.95 || typeof JSE.publicStats.pubs === 'undefined') { // 200 mins approx
			JSE.jseDataIO.getVariable('publicStats/clients',function(clientStats) {
				const now = new Date().getTime();
				const cutOffTime = now - 3600000; // 1 hour
				Object.keys(clientStats).forEach(function(client) {
					if (clientStats[client].updated < cutOffTime) {
						JSE.jseDataIO.hardDeleteVariable('publicStats/clients/'+client); // remove client from stats if no recent update
					}
				});
			});
			JSE.jseDataIO.vcStats(); // async additional stats
		}

		if (Math.random() > 0.66 || typeof JSE.publicStats.pubs === 'undefined') { // 30 mins approx
			JSE.jseDataIO.getVariable('siteIDs',function(siteIDs) {
				let pubs = 0;
				//for (let i in siteIDs) {
				Object.keys(siteIDs).forEach(function(i) {
					let maxSiteCount = 0;
					//if (!siteIDs.hasOwnProperty(i)) continue;
					if (siteIDs[i]) {
						Object.keys(siteIDs[i]).forEach(function(key) {
						//for(const key in siteIDs[i]) {
							maxSiteCount +=1;
							if (maxSiteCount < 100 && siteIDs[i][key].s !== 'Platform Mining' && siteIDs[i][key].s !== 'undefined') { // no more than 100 sites per user
								pubs +=1;
							}
						});
					}
				});
				JSE.publicStats.pubs = pubs;
				JSE.jseDataIO.setVariable('publicStats/pubs',JSE.publicStats.pubs);
			});
		}
		const tmpDate = new Date();
		const oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
		const firstDate = new Date(1502788255000);
		const diffDays = Math.round(Math.abs((firstDate.getTime() - tmpDate.getTime())/(oneDay)));
		JSE.publicStats.days = diffDays; // days since launch
		JSE.jseDataIO.setVariable('publicStats/ts',JSE.publicStats.ts);
		JSE.jseDataIO.setVariable('publicStats/days',JSE.publicStats.days);
		JSE.jseDataIO.updateExchangeRates(); // async exchange api calls
	},

	/**
	 * @method <h2>getMyExportedCoins</h2>
	 * @description Get a list of a users exported coincodes
	 * @param {number} uid User ID
	 * @param {function} callback callback with an array of exported coin objects
	 */
	getMyExportedCoins(uid,callback) {
		JSE.jseDataIO.getVariable('lookupExports/'+uid,function(exported) { // optimise this, loading entire exported coins db
			const myCoinCodeKeys = [];
			const myExports = [];
			//for (let key in exported) {
			Object.keys(exported).forEach(function(key) {
				//if (!exported.hasOwnProperty(key)) continue;
				myCoinCodeKeys.push('exported/'+exported[key]);
			});
			if (myCoinCodeKeys.length > 0) {
				let removedCoinCodes = 0;
				for (let i = 0; i < myCoinCodeKeys.length; i+=1) {
					JSE.jseDataIO.getVariable(myCoinCodeKeys[i],function(eCoin) { // eslint-disable-line
						if (typeof eCoin.removed === 'undefined') { // user can remove from being sent back to make it secret
							myExports.push(eCoin);
						} else {
							removedCoinCodes += 1;
						}
						if (myExports.length === (myCoinCodeKeys.length - removedCoinCodes)) { callback(myExports); }
					});
				}
			} else {
				callback(myExports);
			}
		});
	},

		/**
	 * @method <h2>getAdminExportedCoins</h2>
	 * @description Used only by admin to check coincodes including removals
	 * @param {number} uid User ID
	 * @param {function} callback callback with an array of exported coin objects
	 */
	getAdminExportedCoins(uid,callback) {
		JSE.jseDataIO.getVariable('lookupExports/'+uid,function(exported) { // optimise this, loading entire exported coins db
			const myCoinCodeKeys = [];
			const myExports = [];
			Object.keys(exported).forEach(function(key) {
				myCoinCodeKeys.push('exported/'+exported[key]);
			});
			if (myCoinCodeKeys.length > 0) {
				for (let i = 0; i < myCoinCodeKeys.length; i+=1) {
					JSE.jseDataIO.getVariable(myCoinCodeKeys[i],function(eCoin) { // eslint-disable-line
						myExports.push(eCoin);
						if (myExports.length === myCoinCodeKeys.length) { callback(myExports); }
					});
				}
			} else {
				callback(myExports);
			}
		});
	},

	/**
	 * @method <h2>getAdminAccounts</h2>
	 * @description Download all the accounts for the admin panel
	 * @param {number} startID User ID to start at
	 * @param {number} endID User ID to end at
	 * @param {function} callback callback with a large object of user accounds, does not include credential data
	 * @todo security improvement would be to include the admin key in the lookup
	 */
	getAdminAccounts(startID,endID,callback) {
		const adminAccounts = {};
		for (let i = startID; i <= endID; i+=1) { // need to be <= ??
			JSE.jseDataIO.getVariable('account/'+i,function(returnObj) {
				adminAccounts[i] = returnObj;
				if (i === endID) {
					callback(adminAccounts);
				}
			});
		}
	},

	/**
	 * @method <h2>resetDailyStats</h2>
	 * @description move statsToday across to statsDaily so users keep an array of previous days stats.
	 */
	resetDailyStats() {
		JSE.jseDataIO.getVariable('statsToday', function(statsToday) {
			//for (let uid in statsToday) {
			Object.keys(statsToday).forEach(function(uid) {
				JSE.jseDataIO.pushVariable('statsDaily/'+uid,statsToday[uid],function(pushRef){});
			});
			JSE.jseDataIO.deleteVariable('statsToday');
		});
	},

	/**
	 * @method <h2>getPubStats</h2>
	 * @description Get statsDaily, siteIDs and subIDs stats
	 * @param {number} uid User ID
	 * @param {function} callback callback with stats object
	 */
	getPubStats(uid,callback) {
		const stats = {};
		JSE.jseDataIO.getVariable('statsDaily/'+uid, function(statsDaily) {
			stats.statsDaily = statsDaily || {};
			JSE.jseDataIO.getVariable('siteIDs/'+uid, function(siteIDs) {
				stats.siteIDs = siteIDs || {};
				JSE.jseDataIO.getVariable('subIDs/'+uid, function(subIDs) {
					stats.subIDs = subIDs || {};
					callback(stats);
				});
			});
		});
	},

	/**
	 * @method <h2>miningMaintenance</h2>
	 * @description Limit the number of mining transactions to 25 on this account to save data bloat
	 * @param {number} uid User ID
	 * @todo deleteVariable needs to be a hard delete as it's currently leaving the push keys in
	 */
	miningMaintenance(uid) {
		if (uid > 0) {
			JSE.jseDataIO.getVariable('mining/'+uid,function(mining) {
				const pushRefArray = [];
				if (typeof mining === 'undefined' || mining === null) {
					console.log('Mining maintenance null error 819 for uid: '+uid);
				} else {
					Object.keys(mining).forEach(function(pushRef) {
						pushRefArray.push(pushRef);
					});
					if (pushRefArray.length > 25) {
						for (let i = 0; i < (pushRefArray.length-25); i+=1) {
							JSE.jseDataIO.hardDeleteVariable('mining/'+uid+'/'+pushRefArray[i]);
						}
					}
				}
			});
		} else if (JSE.jseTestNet) {
			console.log('mining maintenance error modules/firebase.js 852');
		}
	},

	/**
	 * @method <h2>countSubValues</h2>
	 * @description Count the number of pushed variables at key that match the value given
	 * @param {string} key firebase style key
	 * @param {string/object/number/boolean} value can be a string, object, boolean, number anything that can be handled by JS & JSON.
	 * @param {function} callback callback with the count as a number
	 */
	countSubValues (key,value,callback) {
		JSE.jseDataIO.getVariable(key,function(returnObj) {
			let valueCount = 0;
			if (typeof returnObj !== 'undefined') {
				Object.keys(returnObj).forEach(function(key2) {
				//for (let key in returnObj) {
					//if (!returnObj.hasOwnProperty(key)) continue;
					if (returnObj[key2].i === value) valueCount +=1;
				});
				callback(valueCount);
			} else {
				callback(0);
			}
		});
	},
};

module.exports = jseDB;
