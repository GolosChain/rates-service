const core = require('gls-core-service');
const env = require('./env');
const MongoDB = require('./services/MongoDB');
const QuoteExtractor = require('./services/QuoteExtractor');
const DailySampler = require('./services/DailySampler');
const Api = require('./services/Api');

const stats = core.Stats.client;
const { Basic, Gate } = core.service;
//const MongoDB = core.service.MongoDB;
const { Logger } = core;

class Main extends Basic {
    constructor() {
        super();

        this.mongo = new MongoDB();
        const api = new Api(Gate, this.mongo);
        const quoteExtractor = new QuoteExtractor(this.mongo);
        const dailySampler = new DailySampler(this.mongo);

        this.printEnvBasedConfig(env);
        this.addNested(this.mongo, api, quoteExtractor, dailySampler);
        this.stopOnExit();
    }

    async start() {
        await this.startNested();
        await this.restore();
        stats.increment('main_service_start');
    }

    async restore() {
        await this._checkHistoricalDump(this.mongo.db);
    }

    async stop() {
        await this.stopNested();
        stats.increment('main_service_stop');
        process.exit(0);
    }

    async _checkHistoricalDump(db) {
        const historicalCollection = db.collection('historical');

        try {
            const stats = await historicalCollection.stats();

            if (stats.count > 0) {
                return;
            }
        } catch(err) {}

        Logger.log('Start historical data recovery');

        const data = require('../data/historical-data.json');

        for (let item of data) {
            await historicalCollection.insertOne(item);
        }

        Logger.log('Historical data recovery complete');
    }
}

module.exports = Main;
