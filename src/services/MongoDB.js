const core = require('gls-core-service');
const mongodb = require('mongodb');
const env = require('../env');

const { Logger } = core;

const BasicService = core.service.Basic;

const DB_NAME = 'rates';

class MongoDB extends BasicService {
    async start() {
        this._client = await mongodb.connect(
            env.GLS_MONGO_CONNECT,
            { useNewUrlParser: true }
        );

        this.db = this._client.db(DB_NAME);

        await this._ensureIndexes();
    }

    async _ensureIndexes() {
        await this.db.collection('actual').createIndex({ date: 1 });
        await this.db.collection('actual').createIndex({ stamp: -1 });
        await this.db.collection('historical').createIndex({ date: -1 }, { unique: true });
    }

    async stop() {
        await this._client.close();
    }
}

module.exports = MongoDB;
