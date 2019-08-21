/**
 * @module jseEthIntegration
 * @description Ethereum and web3 integration functions
 * <h5>Exported</h5>
 * <ul>
 * <li>newKeyPair</li>
 * <li>addToQueryPool</li>
 * <li>checkQueryPoolDeposits</li>
 * <li>fromBlock</li>
 * <li>updateFromBlock</li>
 * <li>checkJSE</li>
 * <li>deposit</li>
 * <li>sendJSE</li>
 * </ul>
 */

const JSE = global.JSE;

const request = require('request');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/'+JSE.credentials.infuraAPIKey));
const jseTokenContractAddress = '0x2d184014b5658C453443AA87c8e9C4D57285620b';

const jseTokenABI = [{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"operatorAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_adminAddress","type":"address"}],"name":"setAdminAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_operatorAddress","type":"address"}],"name":"setOperatorAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"initialSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"finalized","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"adminAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[],"name":"Finalized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_newAddress","type":"address"}],"name":"AdminAddressChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_newAddress","type":"address"}],"name":"OperatorAddressChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"burner","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":true,"name":"data","type":"bytes"}],"name":"Transfer","type":"event"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"tokenAddress","type":"address"},{"name":"tokens","type":"uint256"}],"name":"transferAnyERC20Token","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"finalize","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]; // eslint-disable-line
const token = new web3.eth.Contract(jseTokenABI, jseTokenContractAddress);

const jseEthIntegration = {

	/**
	 * @method <h2>newKeyPair</h2>
	 * @description create an eth key pair
	 * @returns {object} including privateKey and address (publicKey)
	 */
	newKeyPair() {
		const ethKeyPair = web3.eth.accounts.create();
		return ethKeyPair;
	},

	/**
	 * @method <h2>addToQueryPool</h2>
	 * @description add Eth address to query pool for deposited transactions
	 * @param {number} uid user id
	 * @param {string} ethAddress the users ethereum deposit address for JSE ERC20 tokens
	 * @returns false
	 */
	addToQueryPool(uid,ethAddress) {
		const queryObj = {};
		queryObj.type = 'deposit';
		queryObj.ts = new Date().getTime();
		queryObj.uid = uid;
		queryObj.ethAddress = ethAddress;
		JSE.jseDataIO.setVariable('queryPool/'+uid,queryObj); // overwrites previous query, new timestamp
		return false;
	},

	/**
	 * @method <h2>checkQueryPool</h2>
	 * @description check query pool for deposited transactions
	 * @returns false
	 */
	checkQueryPoolDeposits: async() => {
		const fromBlockDone = await jseEthIntegration.updateFromBlock();
		JSE.jseDataIO.getVariable('queryPool/',function(queryPool) {
			let queryCount = 0;
			if (queryPool === null || typeof queryPool === 'undefined') return false;
			const now = new Date().getTime();
			Object.keys(queryPool).forEach(function(uidRef) {
				const query = queryPool[uidRef];
				if (query.type === 'deposit') {
					queryCount += 1;
					jseEthIntegration.checkJSE(query.ethAddress,query.uid);
				}
				if (query.ts < now - 3600000) {
					JSE.jseDataIO.hardDeleteVariable('queryPool/'+uidRef);
				}
			});
			if (JSE.jseTestNet) console.log('queryPool: '+queryCount);
			return false;
		});
		return false;
	},

	/**
	 * @var fromBlock
	 * @description the current block number for ethereum - 3 hours
	 * set in checkQueryPoolDeposits once every time the queryPool is checked (10mins), used in checkJSE
	 */
	fromBlock: 0,

	updateFromBlock: async() => {
		const currentEthBlockNo = await web3.eth.getBlockNumber();
		jseEthIntegration.fromBlock = currentEthBlockNo - 1000; // change this number if we want to look back further. Eth block times are between 10-15secs
		if (JSE.jseTestNet) console.log('Eth Current Block:'+currentEthBlockNo);
		return jseEthIntegration.fromBlock;
	},

	/**
	 * @method <h2>checkJSE</h2>
	 * @description check eth address for deposited JSE ERC20 tokens
	 * @param {string} ethAddress ethereum hex address
	 * @param {number} uid user id
	 * @returns false
	 */
	checkJSE: async (ethAddress,uid) => {
		const events = await token.getPastEvents("Transfer", {
			fromBlock: jseEthIntegration.fromBlock,
			filter: {
				isError: 0,
				txreceipt_status: 1,
			},
			topics: [
				web3.utils.sha3("Transfer(address,address,uint256)"),
				null,
				web3.utils.padLeft(ethAddress, 64),
			],
		});
		for (let i = 0; i < events.length; i+=1) {
			const txEvent = events[i];
			const tx = {};
			tx.uid = uid;
			tx.hash = txEvent.transactionHash;
			const rawValue = web3.utils.fromWei(txEvent.returnValues.value);
			tx.value = JSE.jseFunctions.round(parseFloat(rawValue));
			tx.from = txEvent.returnValues.from;
			tx.to = txEvent.returnValues.to;
			if (JSE.jseTestNet) console.log('tx:'+tx.uid+'/'+tx.value+'/'+tx.from+'/'+tx.to+'/'+tx.hash+'/');
			JSE.jseDataIO.getVariable('ethProcessed/'+tx.hash,function(ethTx) {
				if (ethTx === null && ethAddress === tx.to) { // check transaction hasn't already been processed
					JSE.jseDataIO.setVariable('ethProcessed/'+tx.hash,tx);
					jseEthIntegration.deposit(tx,function(jsonResponse) {
						if (jsonResponse.indexOf('success') > -1) {
							console.log('Deposit: '+tx.uid+' - '+tx.value+'JSE');
							JSE.jseFunctions.depositNotificationEmail(tx.uid,tx.value,tx.hash);
						} else {
							console.log('Deposit Fail error etheintegration.js 128 - '+tx.uid+' - '+tx.value+'JSE');
						}
					});
				} else if (JSE.jseTestNet) {
					console.log('tx Already Processed: '+tx.hash);
				}
			});
		}
	},

	/**
	 * @method <h2>deposit</h2>
	 * @description Deposit JSE ERC20 tokens into the platform
	 * @param {object} tx eth transaction from modules/ethintegration.js checkJSE()
	 * @param {function} callback6 user id of client importing tokens
	 * @param {function} callback4 returns the JSON result to the calling function
	 */
	deposit(tx, callback6) {
		JSE.jseDataIO.getUserByUID(tx.uid,function(quickLookup) {
			JSE.jseDataIO.checkUserByPublicKey(quickLookup.publicKey,function(goodCredentials) {
				JSE.jseDataIO.setVariable('locked/'+goodCredentials.uid,true);
				JSE.lockedUIDs.push(goodCredentials.uid);
				const newData = {};
				newData.command = 'deposit';
				newData.user1 = goodCredentials.uid;
				newData.publicKey = goodCredentials.publicKey;
				newData.txHash = tx.hash;
				newData.txTo = tx.to;
				newData.txFrom = tx.from;
				newData.value = tx.value;
				newData.ts = new Date().getTime();
				JSE.jseDataIO.pushBlockData(newData,function(blockData) {
					JSE.jseDataIO.addBalance(goodCredentials.uid,newData.value);
					JSE.jseDataIO.pushVariable('history/'+goodCredentials.uid,blockData,function(pushRef) {});
					callback6('{"success":1,"value":"' + newData.value + '","notification":"Deposit Successful"}');
				});
			},  function(failObject) {
				callback6('{"fail":1,"notification":"Deposit Failed: Check User failed"}');
			});
		}, function() {
			callback6('{"fail":1,"notification":"Deposit Failed: User public key credentials could not be matched"}');
		});
	},

	/**
	 * @method <h2>calculateGasPrice</h2>
	 * @description get the current gas price for a network and then add a bit to ensure the tx gets through
	 * @returns string gas price
	 */
	calculateGasPrice: async () => {
		const gasPrice = await web3.eth.getGasPrice();
		let gasPriceInt = parseInt(gasPrice,10); // gas price is returned as a string
		if (gasPrice > 30000000000) {
			gasPriceInt += 5000000000; // if > 30 +5 gwei
		} else if (gasPrice > 15000000000) {
			gasPriceInt += 4000000000; // if > 15 +4 gwei
		} else if (gasPrice > 5000000000) {
			gasPriceInt += 3000000000; // if > 5 +3 gwei
		} else if (gasPrice > 2000000000) {
			gasPriceInt += 2000000000; // if > 2 +2 gwei
		} else {
			gasPriceInt += 1000000000; // if < 2 +1 gwei
		}
		const finalGasPrice = String(gasPriceInt);
		return finalGasPrice;
	},

	/**
	 * @method <h2>sendJSE</h2>
	 * @description send JSE ERC20 tokens to an address
	 * @returns {object} including privateKey and address (publicKey)
	 */
	sendJSE: async (withdrawalAddress,value,callback) => {
		// Select one of four eth accounts to rotate them
		JSE.ethAccount = (JSE.ethAccount || 0) + 1;
		if (JSE.ethAccount > 4) JSE.ethAccount = 1;
		//JSE.ethAccount = 1; // just use account1 for testing
		const ownerWallet = web3.eth.accounts.wallet.add(JSE.credentials[`ethAccount${JSE.ethAccount}`]);
		let transactionCount = await web3.eth.getTransactionCount(ownerWallet.address);
		if (!JSE.transactionCounts)	JSE.transactionCounts = {};
		if (transactionCount === JSE.transactionCounts[`ethAccount${JSE.ethAccount}`]) {
			transactionCount += 1;
			JSE.transactionCounts[`ethAccount${JSE.ethAccount}`] = transactionCount;
		} else {
			JSE.transactionCounts[`ethAccount${JSE.ethAccount}`] = transactionCount;
		}
		console.log(`TC: ${transactionCount} Sending ${value} JSE to ${withdrawalAddress}`);
		const transferAmount = web3.utils.toWei(value.toString()); //value * 1e18; // this is the decimal 18 decimals
		//const gasPrice = await web3.eth.getGasPrice();
		const gasPrice = await jseEthIntegration.calculateGasPrice();
		const gasLimit = 90000; // updated to 90000 (mainnet) from 999000 in testing;
		const rawTransaction = {
			from: ownerWallet.address,
			nonce: web3.utils.toHex(transactionCount),
			gasPrice: web3.utils.toHex(gasPrice),
			gasLimit: web3.utils.toHex(gasLimit),
			to: jseTokenContractAddress,
			value: "0x0",
			data: token.methods.transfer(withdrawalAddress, transferAmount).encodeABI(),
			chainId: 1, // needs updating from rinkeby to mainnet
		};
		ownerWallet.signTransaction(rawTransaction, function(error,signed) {
			if (error) console.log('ethintegration.js error 161 signTransaction: '+error);
			// Check it's a valid signature
			const recoveryAddress = web3.eth.accounts.recoverTransaction(signed.rawTransaction);
			const serializedTxHex = signed.rawTransaction;
			let txHash = null;
			web3.eth.sendSignedTransaction(serializedTxHex)
			.on('transactionHash', function(hash) {
				//callback(hash);
				console.log(`TC: ${transactionCount} txHash: ${hash}`);
				txHash = hash;
			})
			//.on('receipt', function(receipt) {})
			.on('confirmation', function(confirmationNumber, receipt){
				//console.log(typeof confirmationNumber +' / '+confirmationNumber);
				if (confirmationNumber === 2) {
					console.log(`TC: ${transactionCount} confirmed`);
					callback(txHash);
				}
			})
			.on('error', function(error1) {
				console.log('ethIntegration Error line 212 ethintegration.js');
				callback(false);
			});
		});
	},

	balanceETH: async (account) => {
		return new Promise((resolve,reject) => {
			web3.eth.getBalance(account,'latest').then((weiBalance) => {
				const ethBalance = JSE.jseFunctions.round(web3.utils.fromWei(weiBalance));
				resolve(ethBalance);
			});
		});
	},

	balanceJSE: async (account) => {
		return new Promise((resolve,reject) => {
			token.methods.balanceOf(account).call().then((weiBalance) => {
				const jseBalance = JSE.jseFunctions.round(web3.utils.fromWei(weiBalance));
				resolve(jseBalance);
			});
		});
	},

	balanceBTC: async (account) => {
		return new Promise((resolve,reject) => {
			const btcURL = `https://blockchain.info/q/addressbalance/${account}`;
			request(btcURL, function (error, response, body) {
				const btcBalance = JSE.jseFunctions.round(body);
				resolve(btcBalance);
			});
		});
	},

};

module.exports = jseEthIntegration;
