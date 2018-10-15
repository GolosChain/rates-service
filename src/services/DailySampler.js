const core = require('gls-core-service');
const moment = require('moment-timezone');
const { Historical, Actual } = require('../model');

const { Moments, Logger } = core;
const stats = core.Stats.client;
const BasicService = core.service.Basic;

const OFFSET_OF_RUN = 30; // seconds
const RECOVER_DAYS_BEFORE = 7;

class DailySampler extends BasicService {
    async start() {
        await this.restore();

        const nextDay = moment
            .tz('UTC')
            .endOf('day')
            .add(OFFSET_OF_RUN, 'seconds');

        this.startLoop(nextDay - Date.now(), Moments.oneDay);
    }

    async restore() {
        this._tryRecover().catch(err => {
            stats.increment('daily_sampler_recover_error');
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
            Logger.error('DailySampler failed:', err);
        }
    }

    async _makeSample(date) {
        const lastValue = await Actual.findOne({ date }, { rates: 1 }, { sort: { date: -1 } });

        if (!lastValue) {
            throw new Error(`Last record in actual not found for ${date}`);
        }

        await Historical.updateOne(
            { date },
            {
                $set: {
                    date,
                    rates: lastValue.rates,
                },
            },
            { upsert: true }
        );

        Logger.info(`Historical record added for date ${date}`);

        return true;
    }

    async _tryRecover() {
        const yesterday = moment();

        yesterday.hour(12);
        yesterday.subtract(1, 'day');

        let countOfMissed = 0;

        for (let i = RECOVER_DAYS_BEFORE; i >= 0; --i) {
            const day = moment(yesterday).subtract(i, 'day');
            const date = day.format('YYYY-MM-DD');

            const data = await Historical.findOne({
                date,
            });

            if (!data) {
                let ok = false;

                try {
                    ok = await this._makeSample(date);
                } catch (err) {
                    Logger.error('Recovery failed', date, err);
                }

                if (!ok) {
                    countOfMissed++;
                    Logger.error('Missed rates for:', date);
                }
            }
        }

        stats.gauge('missed_dates', countOfMissed);

        await this._cleanActualBefore(yesterday.format('YYYY-MM-DD'));
    }

    async _cleanActualBefore(date) {
        await Actual.deleteMany({
            date: {
                $lte: date,
            },
        });
    }
}

module.exports = DailySampler;
