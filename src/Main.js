const core = require('gls-core-service');
const env = require('./env');
const DumpLoader = require('./services/DumpLoader');
const QuoteExtractor = require('./services/QuoteExtractor');
const DailySampler = require('./services/DailySampler');
const GateService = require('./services/Gate');
const CoinMarketApi = require('./helpers/CoinMarketApi');

const stats = core.Stats.client;
const { Basic, Gate, MongoDB } = core.service;

class Main extends Basic {
    constructor() {
        super();

        const mongo = new MongoDB();
        const dumpLoader = new DumpLoader();
        const coinApi = new CoinMarketApi();
        const quoteExtractor = new QuoteExtractor(coinApi);
        const gate = new GateService(Gate, quoteExtractor);
        const dailySampler = new DailySampler();

        this.printEnvBasedConfig(env);
        this.addNested(mongo, dumpLoader, gate, quoteExtractor, dailySampler);
        this.stopOnExit();
    }

    async start() {
        await this.startNested();
        stats.increment('main_service_start');
    }

    async stop() {
        await this.stopNested();
        stats.increment('main_service_stop');
        process.exit(0);
    }
}

module.exports = Main;
