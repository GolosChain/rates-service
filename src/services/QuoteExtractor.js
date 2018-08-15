const core = require('gls-core-service');
const moment = require('moment-timezone');
const { getQuotes } = require('../utils/api');
const env = require('../env');

const { Logger } = core;

const BasicService = core.service.Basic;

const CURRENCIES = ['USD', 'EUR', 'RUB'];

class QuoteExtractor extends BasicService {
    constructor(mongo) {
        super();
        this.mongo = mongo;
    }

    async start() {
        const newDay = moment.tz('UTC');
        newDay.hour(0);
        newDay.minute(0);
        newDay.second(0);
        newDay.millisecond(0);
        newDay.add(1, 'day');

        this.startLoop(0, env.GLS_FETCH_INTERVAL * 1000);
    }

    async iteration() {
        await this._safeParse();
    }

    async _safeParse() {
        try {
            await this._parse();
        } catch (err) {
            Logger.error('Safe parse error:', err);
        }
    }

    async _parse() {
        const db = this.mongo.db;

        const result = await getQuotes(CURRENCIES);

        const actualCollection = db.collection('actual');

        const now = new Date();
        const date = moment(now).format('YYYY-MM-DD');

        const insertData = {
            rates: {
                GBG: extractQuote(result.data.GBG.quote),
                GOLOS: extractQuote(result.data.GOLOS.quote),
            },
            date,
            stamp: new Date(),
        };

        await actualCollection.insertOne(insertData);
    }
}

function extractQuote(quotes) {
    return {
        USD: quotes.USD.price,
        EUR: quotes.EUR.price,
        RUB: quotes.RUB.price,
    };
}

module.exports = QuoteExtractor;
