const moment = require('moment-timezone');

class DailySampler {
    constructor(db) {
        this._db = db;
    }

    start() {
        this._scheduleNextRun();

        this._tryRecover().catch(err => {
            console.error('recover failed', err);
        });
    }

    _scheduleNextRun() {
        const now = moment.tz('UTC');

        const newDay = now.clone();
        newDay.hour(0);
        newDay.minute(0);
        newDay.second(0);
        newDay.millisecond(0);
        newDay.add(1, 'day');

        const date = now.format('YYYY-MM-DD');

        setTimeout(async () => {
            this._scheduleNextRun();

            try {
                await this._makeSample(date);
                await this._cleanActualBefore(date);
            } catch (err) {
                console.error('DailySampler failed:', err);
            }
        }, newDay - Date.now() + 1000);
    }

    async _makeSample(date) {
        const actualCollection = this._db.collection('actual');
        const historicalCollection = this._db.collection('historical');

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

    async _tryRecover() {
        const yesterday = moment();
        yesterday.hour(12);
        yesterday.subtract(1, 'day');

        for (let i = 6; i >= 0; --i) {
            const day = moment(yesterday).subtract(i, 'day');

            const date = day.format('YYYY-MM-DD');

            const historicalCollection = this._db.collection('historical');

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

    async _cleanActualBefore(date) {
        const actualCollection = this._db.collection('actual');

        await actualCollection.deleteMany({
            date: {
                $lte: date,
            },
        });
    }
}

module.exports = DailySampler;
