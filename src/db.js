const mongo = require('mongodb');
const env = require('./env');

const DB_NAME = 'rates';

let db;

async function connect() {
    const db = await _connect();

    await db.collection('actual').createIndex({ date: 1 });
    await db.collection('historical').createIndex({ date: 1 }, { unique: true });

    return db;
}

function _connect() {
    return new Promise((resolve, reject) => {
        mongo.connect(
            env.GLS_MONGO_CONNECT,
            { useNewUrlParser: true },
            (err, client) => {
                if (err) {
                    reject(err);
                } else {
                    db = client.db(DB_NAME);
                    resolve(db);
                }
            }
        );
    });
}

function getDb() {
    return db;
}

function close() {
    db.close();
}

module.exports = {
    connect,
    getDb,
    close,
};
