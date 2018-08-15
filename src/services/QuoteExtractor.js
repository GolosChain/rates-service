const core = require('gls-core-service');
const moment = require('moment-timezone');
const { getQuotes } = require('../utils/api');
const env = require('../env');
const { Actual } = require('../model');

const { Logger } = core;

const BasicService = core.service.Basic;

const CURRENCIES = ['USD', 'EUR', 'RUB'];

class QuoteExtractor extends BasicService {
    async start() {
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
        const result = await getQuotes(CURRENCIES);

        const now = new Date();
        const date = moment(now).format('YYYY-MM-DD');

        const newEntry = new Actual({
            rates: {
                GBG: extractQuote(result.data.GBG.quote),
                GOLOS: extractQuote(result.data.GOLOS.quote),
            },
            date,
            stamp: new Date(),
        });

        await newEntry.save();
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
