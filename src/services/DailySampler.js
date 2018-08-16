const core = require('gls-core-service');
const moment = require('moment-timezone');
const { Historical, Actual } = require('../model');

const { Moments, Logger } = core;
const stats = core.Stats.client;
const BasicService = core.service.Basic;

const RECOVER_DAYS_BEFORE = 7;

class DailySampler extends BasicService {
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
            console.error('DailySampler failed:', err);
        }
    }

    async _makeSample(date) {
        const lastValue = await Actual.findOne({ date }, { rates: 1 }, { sort: { date: -1 } });

        if (!lastValue) {
            return;
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
                    console.error('Recovery failed', date, err);
                }

                if (!ok) {
                    countOfMissed++;
                    console.error('Missed rates for:', date);
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
