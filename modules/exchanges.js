/**
 * @module jseExchanges
 * @description Integration with the exchange API's
 * <h5>Exported</h5>
 * <ul>
 * <li>latokenAPI</li>
 * <li>idexAPI</li>
 * <li>getExchangeRates</li>
 * </ul>
 *
 */
const JSE = global.JSE;
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
					const avgPrice = (result.bid + result.ask + result.last_price) / 3;
					resolve(JSE.jseFunctions.round(avgPrice));
				} else {
					console.log('LATOKEN API ERROR exchanges.js 32');
					//console.log(result);
					resolve(false);
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
					const avgPrice = (Number(result.highestBid) + Number(result.lowestAsk) + Number(result.last)) / 3;
					resolve(JSE.jseFunctions.round(avgPrice));
				} else {
					console.log('IDEX API ERROR exchanges.js 57');
					//console.log(result);
					resolve(false);
				}
			});
		});
	},

	/**
	 * @method <h2>coingeckoAPI</h2>
	 * @description Return API data object from CoinGecko
	 * @returns {array} contains an array of coin objects, each includes id, symbol current_price
	 * also contains market caps etc. Load the URL for more info.
	 */
	coingeckoAPI: async () => {
		const apiURL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=jsecoin%2Cbitcoin%2Cethereum`;
		return new Promise(function(resolve, reject) {
			request.get({
				url: apiURL,
				json: true,
			}, (err, res, result) => {
				if (typeof result === 'object') {
					resolve(result);
				} else {
					console.log('CoinGecko API ERROR exchanges.js 83');
					resolve(false);
				}
			});
		});
	},


	/**
	 * @method <h2>updateCurrencyData</h2>
	 * @description Calculate the average pricing from idex api data
	 * @returns {float} price/exchange rate
	 */
	updateCurrencyData: async () => {
		return new Promise(function(resolve, reject) {
			const currencyData = {};
			request.get({
				url: 'https://openexchangerates.org/api/latest.json?app_id='+JSE.credentials.openexchangeratesAPIKey,
				json: true,
			}, (err, res, result) => {
				if (typeof result === 'object' && 'rates' in result) {
					currencyData.USDEUR = result.rates.EUR;
					currencyData.USDJPY = result.rates.JPY;
					currencyData.USDGBP = result.rates.GBP;
					currencyData.USDAUD = result.rates.AUD;
					currencyData.USDCAD = result.rates.CAD;
					currencyData.USDCHF = result.rates.CHF;
					currencyData.USDCNY = result.rates.CNY;
					currencyData.USDSEK = result.rates.SEK;
					currencyData.USDNZD = result.rates.NZD;
					currencyData.USDMXN = result.rates.MXN;
					currencyData.USDSGD = result.rates.SGD;
					currencyData.USDHKD = result.rates.HKD;
					currencyData.USDNOK = result.rates.NOK;
					currencyData.USDKRW = result.rates.KRW;
					currencyData.USDTRY = result.rates.TRY;
					currencyData.USDRUB = result.rates.RUB;
					currencyData.USDINR = result.rates.INR;
					currencyData.USDBRL = result.rates.BRL;
					currencyData.USDZAR = result.rates.ZAR;
					currencyData.ts = new Date().getTime();
					resolve(currencyData);
				} else {
					console.log('CURRENCY API ERROR exchanges.js 100');
					JSE.jseFunctions.sendStandardEmail('james@jsecoin.com','JSEcoin Currency Exchange API ERROR','There is an error with the currency API. Check https://openexchangerates.org');
					resolve(JSE.currencyData);
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
		//exchangeRates.ETHJSE = await jseExchanges.latokenAPI('ETH/JSE');
		//exchangeRates.ETHJSE2 = await jseExchanges.idexAPI('ETH/JSE');
		if (!exchangeRates.ETHJSE) { // if LATOKEN isn't working try coingecko
			const coinGeckoData = await jseExchanges.coingeckoAPI();
			if (!coinGeckoData) return false; // quit if LATOKEN and CoinGecko API aren't working
			coinGeckoData.forEach((coinObject) => {
				if (coinObject.symbol === 'btc') exchangeRates.USDBTC = JSE.jseFunctions.round(coinObject.current_price);
				if (coinObject.symbol === 'eth') exchangeRates.USDETH = JSE.jseFunctions.round(coinObject.current_price);
				if (coinObject.symbol === 'jse') exchangeRates.USDJSE = JSE.jseFunctions.round(coinObject.current_price);
			});
			exchangeRates.ETHJSE = JSE.jseFunctions.round(exchangeRates.USDJSE / exchangeRates.USDETH);
		} else {
			exchangeRates.USDETH = await jseExchanges.latokenAPI('USDT/ETH');
			exchangeRates.USDBTC = await jseExchanges.latokenAPI('USDT/BTC');
			exchangeRates.USDJSE = JSE.jseFunctions.round(exchangeRates.ETHJSE * exchangeRates.USDETH);
		}
		exchangeRates.BTCJSE = JSE.jseFunctions.round(exchangeRates.USDJSE / exchangeRates.USDBTC);

		const nowTS = new Date().getTime();
		const oneHourAgo = nowTS - 3600000; // Update currency exchange rate data at 1 hour intervals
		if (!JSE.currencyData || (JSE.currencyData && JSE.currencyData.ts < oneHourAgo)) {
			JSE.currencyData = await jseExchanges.updateCurrencyData();
		}
		exchangeRates.EURJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDEUR);
		exchangeRates.JPYJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDJPY);
		exchangeRates.GBPJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDGBP);
		exchangeRates.AUDJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDAUD);
		exchangeRates.CADJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDCAD);
		exchangeRates.CHFJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDCHF);
		exchangeRates.CNYJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDCNY);
		exchangeRates.SEKJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDSEK);
		exchangeRates.NZDJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDNZD);
		exchangeRates.MXNJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDMXN);
		exchangeRates.SGDJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDSGD);
		exchangeRates.HKDJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDHKD);
		exchangeRates.NOKJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDNOK);
		exchangeRates.KRWJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDKRW);
		exchangeRates.TRYJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDTRY);
		exchangeRates.RUBJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDRUB);
		exchangeRates.INRJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDINR);
		exchangeRates.BRLJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDBRL);
		exchangeRates.ZARJSE = JSE.jseFunctions.round(exchangeRates.USDJSE * JSE.currencyData.USDZAR);

		exchangeRates.USDETH = Math.round(exchangeRates.USDETH);
		exchangeRates.USDBTC = Math.round(exchangeRates.USDBTC);
		//console.log(exchangeRates);
		return exchangeRates;
	},

};

module.exports = jseExchanges;
