// Описание переменных окружения смотри в Readme.
const env = process.env;

module.exports = {
    GLS_MONGO_CONNECT: env.GLS_MONGO_CONNECT || 'mongodb://localhost:27017',
    GLS_COIN_MARKET_API_ENDPOINT: env.GLS_COIN_MARKET_API_ENDPOINT || 'https://pro-api.coinmarketcap.com/v1/',
    GLS_COIN_MARKET_API_KEY: env.GLS_COIN_MARKET_API_KEY,
    GLS_FETCH_INTERVAL: env.GLS_FETCH_INTERVAL || 5 * 60,
};
