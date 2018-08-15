const request = require('request-promise-native');
const env = require('../env');

function getQuotes(currencies) {
    const apiName = `cryptocurrency/quotes/latest?symbol=GOLOS,GBG&convert=${currencies.join(',')}`;
    return callApi(apiName);
}

function callApi(apiName) {
    const host = env.GLS_COIN_MARKET_API_ENDPOINT;
    const apiKey = env.GLS_COIN_MARKET_API_KEY;

    return request({
        url: `${host}${apiName}`,
        json: true,
        headers: {
            'X-CMC_PRO_API_KEY': apiKey,
        },
        gzip: true,
    }).catch(err => {
        throw err && {
            name: err.name,
            statusCode: err.statusCode,
            message: err.message,
        };
    });
}

module.exports = {
    getQuotes,
};
