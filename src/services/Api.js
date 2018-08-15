const core = require('gls-core-service');
const errors = core.HttpError;
const BasicService = core.service.Basic;
const stats = core.Stats.client;

class Api extends BasicService {
    constructor(Gate, mongo) {
        super();

        this.mongo = mongo;
        this._gate = new Gate();

        this._getActual = this._getActual.bind(this);
        this._getHistorical = this._getHistorical.bind(this);
    }

    async start() {
        await this._gate.start({
            serverRoutes: {
                getActual: this._getActual,
                getHistorical: this._getHistorical,
            },
        });

        this.addNested(this._gate);
    }

    async stop() {
        await this.stopNested();
    }

    async _getActual() {
        const start = Date.now();

        const db = this.mongo.db;

        const rates = db.collection('rates');
        const historical = db.collection('historical');

        let lastActual = await rates.findOne(
            {},
            {
                projection: { rates: 1 },
                sort: {
                    stamp: -1,
                },
            }
        );

        if (!lastActual) {
            lastActual = await historical.findOne(
                {},
                {
                    projection: { rates: 1 },
                    sort: {
                        date: -1,
                    },
                }
            );
        }

        stats.timing('rates_getActual', new Date() - start);

        return {
            rates: lastActual.rates,
        };
    }

    async _getHistorical({ date }) {
        if (!date) {
            throw errors.E400.error;
        }

        const start = Date.now();

        const db = this.mongo.db;

        let data = await db.collection('historical').findOne(
            {
                date: {
                    $gte: date,
                },
            },
            {
                projection: {
                    rates: 1,
                },
                sort: {
                    date: 1,
                },
            }
        );

        if (!data) {
            data = await db.collection('actual').findOne(
                {},
                {
                    projection: {
                        rates: 1,
                    },
                    sort: {
                        stamp: -1,
                    },
                }
            );
        }

        stats.timing('rates_getHistorical', new Date() - start);

        return {
            date,
            rates: data.rates,
        };
    }
}

module.exports = Api;
