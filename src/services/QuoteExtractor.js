const core = require('gls-core-service');
const moment = require('moment-timezone');
const env = require('../env');
const { Actual, Historical } = require('../model');

const { Logger } = core;
const stats = core.Stats.client;
const BasicService = core.service.Basic;

const CURRENCIES = ['USD', 'EUR', 'RUB'];

class QuoteExtractor extends BasicService {
    constructor(coinApi) {
        super();

        this._coinApi = coinApi;
        this._actualRates = null;
    }

    async start() {
        this.startLoop(0, env.GLS_FETCH_INTERVAL * 1000);
    }

    async iteration() {
        await this._safeRun();
    }

    async getActualRates() {
        if (!this._actualRates) {
            let actual = await Actual.findOne(
                {},
                { rates: 1 },
                {
                    sort: {
                        stamp: -1,
                    },
                }
            );

            if (!actual) {
                actual = await Historical.findOne(
                    {},
                    { rates: 1 },
                    {
                        sort: {
                            date: -1,
                        },
                    }
                );
            }

            this._actualRates = injectGolosGBGRate(actual.rates);
        }

        return this._actualRates;
    }

    async _safeRun() {
        try {
            await this._run();
        } catch (err) {
            Logger.error('Safe extract failed:', err);
            stats.increment('rates_quote_extract_error');
        }
    }

    async _run() {
        const result = await this._coinApi.getQuotes(CURRENCIES);

        const now = new Date();
        const date = moment(now).format('YYYY-MM-DD');

        const rates = {
            GBG: extractQuote(result.data.GBG.quote),
            GOLOS: extractQuote(result.data.GOLOS.quote),
        };

        const newEntry = new Actual({
            rates,
            date,
            stamp: new Date(),
        });

        await newEntry.save();

        this._actualRates = injectGolosGBGRate(rates);
    }
}

function extractQuote(quotes) {
    return {
        USD: quotes.USD.price,
        EUR: quotes.EUR.price,
        RUB: quotes.RUB.price,
    };
}

export function injectGolosGBGRate(quotes) {
    quotes.GBG.GOLOS = quotes.GBG.USD / quotes.GOLOS.USD;
    quotes.GOLOS.GBG = 1 / quotes.GBG.GOLOS;

    return quotes;
}

module.exports = QuoteExtractor;
