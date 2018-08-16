const request = require('request-promise-native');
const env = require('../env');

class CoinMarketApi {
    async getQuotes(currencies) {
        const convert = currencies.join(',');
        const apiName = `cryptocurrency/quotes/latest?symbol=GOLOS,GBG&convert=${convert}`;

        return await this._callApi(apiName);
    }

    async _callApi(apiName) {
        const host = env.GLS_COIN_MARKET_API_ENDPOINT;
        const apiKey = env.GLS_COIN_MARKET_API_KEY;

        try {
            return await request({
                url: `${host}${apiName}`,
                json: true,
                headers: {
                    'X-CMC_PRO_API_KEY': apiKey,
                },
                gzip: true,
            });
        } catch (err) {
            throw {
                name: err.name,
                statusCode: err.statusCode,
                message: err.message,
            };
        }
    }
}

module.exports = CoinMarketApi;
