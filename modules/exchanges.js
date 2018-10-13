/**
 * @module jseExchanges
 * @description Integration with the exchange API's
 * <h5>Exported</h5>
 * <ul>
 * <li>latokenAPI</li>
 * <li>idexAPI</li>
 * </ul>
 *
 */

const request = require('request');

const jseExchanges = {
  /**
   * @method <h2>latokenAPI</h2>
   * @description Calculate the average pricing from LA Token's coingecko api data
   * @returns {float} price/exchange rate
   */
  latokenAPI: async (tradingPair) => {
    const apiURL = `https://api.latoken.com/v1/coingecko/market/${tradingPair}`;
    return new Promise(function(resolve, reject) {
      request.get({
        url: apiURL,
        json: true,
      }, (err, res, result) => {
        if (typeof result === 'object' && 'last_price' in result) {
          resolve(result.last_price);
        } else {
          reject(result);
        }
      });
    });
  },

  /**
   * @method <h2>idexAPI</h2>
   * @description Calculate the average pricing from idex api data
   * @returns {float} price/exchange rate
   */
  idexAPI: async (tradingPair) => {
    const formattedTradingPair = tradingPair.split('/').join('_');
    return new Promise(function(resolve, reject) {
      request.get({
        method: 'POST',
        url: 'https://api.idex.market/returnTicker',
        json: {
          market: formattedTradingPair,
        },
      }, (err, res, result) => {
        if (typeof result === 'object' && 'last' in result) {
          resolve(result.last);
        } else {
          reject(result);
        }
      });
    });
  },


/**
 * @method <h2>getExchangeRates</h2>
 * @description Query the exchanges to get live pricing for the JSE token
 * @returns {object} including privateKey and address (publicKey)
 */
  getExchangeRates: async () => {
    const exchangeRates = {};
    exchangeRates.USDETH = await jseExchanges.latokenAPI('USDT/ETH');
    exchangeRates.USDBTC = await jseExchanges.latokenAPI('USDT/BTC');
    exchangeRates.ETHJSE = await jseExchanges.latokenAPI('ETH/JSE');
    exchangeRates.USDJSE = exchangeRates.ETHJSE * exchangeRates.USDETH;

    exchangeRates.ETHSAN = await jseExchanges.idexAPI('ETH/SAN');

    console.log(exchangeRates);
    return exchangeRates;
  },

};

module.exports = jseExchanges;
