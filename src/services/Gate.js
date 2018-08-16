const core = require('gls-core-service');
const errors = core.HttpError;
const stats = core.Stats.client;
const { Historical, Actual } = require('../model');

const { Basic } = core.service;

class Gate extends Basic {
    constructor(Gate, quoteExtractor) {
        super();

        this._gate = new Gate();
        this._quoteExtractor = quoteExtractor;

        this._getActual = this._getActual.bind(this);
        this._getHistorical = this._getHistorical.bind(this);
        this._getHistoricalMulti = this._getHistoricalMulti.bind(this);
    }

    async start() {
        await this._gate.start({
            serverRoutes: {
                getActual: this._getActual,
                getHistorical: this._getHistorical,
                getHistoricalMulti: this._getHistoricalMulti,
            },
        });

        this.addNested(this._gate);
    }

    async stop() {
        await this.stopNested();
    }

    async _getActual() {
        const start = Date.now();

        const rates = await this._quoteExtractor.getActualRates();

        stats.timing('rates_get_actual', new Date() - start);

        return {
            rates,
        };
    }

    async _getHistorical({ date }, disableLogging) {
        if (!date) {
            throw errors.E400.error;
        }

        const start = Date.now();

        let data = await Historical.findOne(
            { date: { $gte: date } },
            { rates: 1 },
            { sort: { date: 1 } }
        );

        if (!data) {
            data = await Actual.findOne({}, { rates: 1 }, { sort: { stamp: -1 } });
        }

        if (!disableLogging) {
            stats.timing('rates_get_historical', new Date() - start);
        }

        return {
            date,
            rates: data.rates,
        };
    }

    async _getHistoricalMulti({ dates }) {
        const items = [];

        const start = Date.now();

        for (let date of dates) {
            items.push(await this._getHistorical({ date }, true));
        }

        stats.timing('rates_get_historical_multi', new Date() - start);

        return {
            items,
        };
    }
}

module.exports = Gate;
