const _ = require('lodash');
const core = require('gls-core-service');
const moment = require('moment-timezone');
const { getQuotes } = require('../utils/api');

const { Moments, Logger } = core;

const BasicService = core.service.Basic;

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

        this.startLoop(0, 5 * Moments.oneMinute);
    }

    async iteration() {
        Logger.info('QuoteExtractor iteration started');

        this._safeParse();
    }

    _safeParse() {
        this._parse().catch(err => {
            Logger.error('Safe parse error:', err);
        });
    }

    async _parse() {
        const db = this.mongo.db;

        const data = await getQuotes();

        const gbgPrice = _.get(data, 'data.GBG.quote.USD.price');
        const golosPrice = _.get(data, 'data.GOLOS.quote.USD.price');

        const actualCollection = db.collection('actual');

        const now = new Date();
        const date = moment(now).format('YYYY-MM-DD');

        const insertData = {
            rates: {
                GBG: {
                    USD: gbgPrice,
                },
                GOLOS: {
                    USD: golosPrice,
                },
            },
            date,
            stamp: new Date(),
        };

        await actualCollection.insertOne(insertData);
    }
}

module.exports = QuoteExtractor;
