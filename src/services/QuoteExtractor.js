const core = require('gls-core-service');
const moment = require('moment-timezone');
const env = require('../env');
const { Actual, Historical } = require('../model');

const { Logger } = core;

const BasicService = core.service.Basic;

const CURRENCIES = ['USD', 'EUR', 'RUB'];

let actualRates = null;

class QuoteExtractor extends BasicService {
    static async getActualRates() {
        if (!actualRates) {
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

            actualRates = actual.rates;
        }

        return actualRates;
    }

    constructor(coinApi) {
        super();

        this._coinApi = coinApi;
    }

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

        actualRates = rates;
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
