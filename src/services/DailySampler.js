const core = require('gls-core-service');
const moment = require('moment-timezone');

const { Moments, Logger } = core;

const stats = core.Stats.client;
const BasicService = core.service.Basic;

class DailySampler extends BasicService {
    constructor(mongo) {
        super();
        this.mongo = mongo;
    }

    async start() {
        await this.restore();

        const newDay = moment.tz('UTC');
        newDay.hour(0);
        newDay.minute(0);
        newDay.second(0);
        newDay.millisecond(0);
        newDay.add(1, 'day');

        this.startLoop(newDay - Date.now() + 30000, Moments.oneDay);
    }

    async restore() {
        Logger.info('LOL WHATS');

        this._tryRecover().catch(err => {
            Logger.error('Recovery failed', err);
        });
    }

    async iteration() {
        Logger.info('DailySampler iteration started');

        const date = moment.tz('UTC').format('YYYY-MM-DD');

        try {
            await this._makeSample(date);
            await this._cleanActualBefore(date);
        } catch (err) {
            console.error('DailySampler failed:', err);
        }
    }

    async _makeSample(date) {
        const db = this.mongo.db;

        const actualCollection = db.collection('actual');
        const historicalCollection = db.collection('historical');

        const lastValue = await actualCollection.findOne(
            { date },
            { sort: { date: -1 }, projection: { rates: 1 } }
        );

        if (!lastValue) {
            return;
        }

        historicalCollection.updateOne(
            {
                date,
            },
            {
                $set: {
                    date,
                    rates: lastValue.rates,
                },
            },
            {
                upsert: true,
            }
        );

        return true;
    }

    async _cleanActualBefore(date) {
        const actualCollection = this.mongo.db.collection('actual');

        await actualCollection.deleteMany({
            date: {
                $lte: date,
            },
        });
    }

    async _tryRecover() {
        const db = this.mongo.db;

        const yesterday = moment();
        yesterday.hour(12);
        yesterday.subtract(1, 'day');

        for (let i = 6; i >= 0; --i) {
            const day = moment(yesterday).subtract(i, 'day');

            const date = day.format('YYYY-MM-DD');

            const historicalCollection = db.collection('historical');

            const data = await historicalCollection.findOne({
                date,
            });

            if (!data) {
                let ok = false;

                try {
                    ok = await this._makeSample(date);
                } catch (err) {
                    console.error('Recovery failed', err);
                }

                if (!ok) {
                    console.error('Missed rates for:', date);
                }
            }
        }

        await this._cleanActualBefore(yesterday.format('YYYY-MM-DD'));
    }
}

module.exports = DailySampler;
