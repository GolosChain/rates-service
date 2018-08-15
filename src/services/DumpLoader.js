const core = require('gls-core-service');
const { Historical } = require('../model');

const { Logger } = core;

const BasicService = core.service.Basic;

class DumpLoader extends BasicService {
    async start() {
        const someData = await Historical.findOne({});

        if (!someData) {
            Logger.log('Start historical data recovery');

            const data = require('../../data/historical-data.json');

            for (let item of data) {
                await new Historical(item).save();
            }

            Logger.log('Historical data recovery complete');
        }
    }
}

module.exports = DumpLoader;
