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

/* THESE LINES NEED CHANGING FOR DEPLOYMENT */
//const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'+JSE.credentials.infuraAPIKey));
//const jseTokenContractAddress = '0x2d184014b5658C453443AA87c8e9C4D57285620b';
const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/'+JSE.credentials.infuraAPIKey));
const jseTokenContractAddress = '0x311884c83e242192a56c3e5e4801edd3ff5b0d6c';

const jseTokenABI = [{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"operatorAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_adminAddress","type":"address"}],"name":"setAdminAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_operatorAddress","type":"address"}],"name":"setOperatorAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"initialSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"finalized","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"adminAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[],"name":"Finalized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_newAddress","type":"address"}],"name":"AdminAddressChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_newAddress","type":"address"}],"name":"OperatorAddressChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"burner","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":true,"name":"data","type":"bytes"}],"name":"Transfer","type":"event"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"tokenAddress","type":"address"},{"name":"tokens","type":"uint256"}],"name":"transferAnyERC20Token","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"finalize","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}];
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
   * @method <h2>sendJSE</h2>
   * @description send JSE ERC20 tokens to an address
   * @returns {object} including privateKey and address (publicKey)
   */
  sendJSE: async (withdrawalAddress,value,callback) => {
    const ownerWallet = web3.eth.accounts.wallet.add(JSE.credentials.ethAccount1);
    const transactionCount = await web3.eth.getTransactionCount(ownerWallet.address);
    const transferAmount = web3.utils.toWei(value.toString()); //value * 1e18; // this is the decimal 18 decimals
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 999000; //90000;
    
    const rawTransaction = {
      "from": ownerWallet.address,
      "nonce": web3.utils.toHex(transactionCount),
      "gasPrice": web3.utils.toHex(gasPrice),
      "gasLimit": web3.utils.toHex(gasLimit),
      "to": jseTokenContractAddress,
      "value": "0x0",
      "data": token.methods.transfer(withdrawalAddress, transferAmount).encodeABI(),
      "chainId": 4
    };
    
    ownerWallet.signTransaction(rawTransaction, function(error,signed) {
      if (error) document.getElementById('test7').innerHTML += 'signTransaction Error: '+error+'<br><br>';

      // Check it's a valid signature
      const recoveryAddress = web3.eth.accounts.recoverTransaction(signed.rawTransaction);
      const serializedTxHex = signed.rawTransaction;
      web3.eth.sendSignedTransaction(serializedTxHex)
      .on('transactionHash', function(hash) {
        callback(hash);
      })
      /*
      .on('receipt', function(receipt) {

      })
      .on('confirmation', function(confirmationNumber, receipt){
 
      })
      */
      .on('error', function(error) {
        callback(false);
      });
    });
  },

};

module.exports = jseEthIntegration;