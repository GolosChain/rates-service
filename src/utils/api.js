const request = require('request-promise-native');
const config = require('./config');

function getQuotes() {
    const apiName = 'cryptocurrency/quotes/latest?symbol=GOLOS,GBG&convert=USD';
    return callApi(apiName);
}

function callApi(apiName) {
    const host = config.get('COIN_MARKET_API_ENDPOINT');
    const apiKey = config.get('COIN_MARKET_API_KEY');

    return request({
        //url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=RUB',
        //url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=100&symbol=GOLOS,GBG&convert=RUB',
        url: `${host}${apiName}`,
        json: true,
        //url: 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest?convert=USD',
        headers: {
            //Accept: 'application/json',
            'X-CMC_PRO_API_KEY': apiKey,
        },
        gzip: true,
    });
}

module.exports = {
    getQuotes,
};
