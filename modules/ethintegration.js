/**
 * @module jseEthIntegration
 * @description Ethereum and web3 integration functions
 * <h5>Exported</h5>
 * <ul>
 * <li>newKeyPair</li>
 * <li></li>
 * <li></li>
 * </ul>
 */

const JSE = global.JSE;

const Web3 = require('web3');
//const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'+JSE.credentials.infuraAPIKey));
const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/'+JSE.credentials.infuraAPIKey));



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
   * @method <h2>sendJSE</h2>
   * @description send JSE ERC20 tokens to an address
   * @returns {object} including privateKey and address (publicKey)
   */
  sendJSE = async (withdrawalAddress,value,callback) => {
    const ownerWallet = web3.eth.accounts.wallet.add(JSE.credentials.ethAccount1);
    const transactionCount = await web3.eth.getTransactionCount(ownerWallet.address);
    const transferAmount = 10000000000; // this is the decimal so at 8 decimals = 0.00000001
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 999000; //90000;
    document.getElementById('test7').innerHTML += 'Previous Transaction Count: '+transactionCount+'<br><br>';

    const weiBalance = await web3.eth.getBalance(ownerWallet.address,'latest');
    const ethBalance = web3.utils.fromWei(weiBalance);
    document.getElementById('test7').innerHTML += 'ETH Balance: '+ethBalance+'<br><br>';

    const rawTransaction = {
      "from": ownerWallet.address,
      "nonce": web3.utils.toHex(transactionCount),
      "gasPrice": web3.utils.toHex(gasPrice),
      "gasLimit": web3.utils.toHex(gasLimit),
      "to": jseTokenContractAddress,
      "value": "0x0",
      "data": token.methods.transfer(ac2PublicKey, transferAmount).encodeABI(),
      "chainId": 4
    };
    
    ownerWallet.signTransaction(rawTransaction, function(error,signed) {
      if (error) document.getElementById('test7').innerHTML += 'signTransaction Error: '+error+'<br><br>';

      // Check it's a valid signature
      const recoveryAddress = web3.eth.accounts.recoverTransaction(signed.rawTransaction);
      document.getElementById('test7').innerHTML += 'Recovery address: '+recoveryAddress + '<br><br>';

      const serializedTxHex = signed.rawTransaction;
      web3.eth.sendSignedTransaction(serializedTxHex)
      .on('transactionHash', function(hash) {
        document.getElementById('test7').innerHTML += 'Hash: <a href="https://rinkeby.etherscan.io/tx/'+hash+'" target="_blank">'+hash+'</a><br><br>';
      })
      .on('receipt', function(receipt) {
        document.getElementById('test7').innerHTML += 'Receipt: '+JSON.stringify(receipt)+'<br><br>';
        token.methods.balanceOf(ac2PublicKey).call().then((result) => {
          document.getElementById('test7').innerHTML += 'New Balance To: '+result+'<br><br>';
        });
        token.methods.balanceOf(ownerWallet.address).call().then((result) => {
          document.getElementById('test7').innerHTML += 'New Balance From: '+result+'<br><br>';
        });
      })
      .on('confirmation', function(confirmationNumber, receipt){
        if (confirmationNumber <= 5) document.getElementById('test7').innerHTML += 'Confirmation Number: '+confirmationNumber+'<br>';
      })
      .on('error', function(error) {
        document.getElementById('test7').innerHTML += 'Error: '+error+'<br><br>';
      });
    });
  }

};

module.exports = jseEthIntegration;