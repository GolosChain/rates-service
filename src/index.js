const _ = require('lodash');
const moment = require('moment');
const { getQuotes } = require('./utils/api');
const { connect } = require('./db');
const DailySampler = require('./utils/DailySampler');

const INTERVAL = 5 * 60 * 1000;
let db = null;

async function run() {
    db = await connect();

    await checkHistoricalDump(db);

    safeParse();
    setInterval(() => safeParse(), INTERVAL);

    const sampler = new DailySampler(db);
    sampler.start();
}

function safeParse() {
    parse().catch(err => {
        console.error(new Date(), err);
    });
}

async function parse() {
    console.log(new Date(), 'parse run');

    const data = await getQuotes();

    //console.log('DATA', JSON.stringify(data, null, 2));

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

    console.log('inserted', insertData);
}

async function checkHistoricalDump(db) {
    const historicalCollection = db.collection('historical');

    try {
        const stats = await historicalCollection.stats();

        if (stats.count > 0) {
            return;
        }
    } catch(err) {}

    console.log('Start historical data recovery');

    const data = require('../data/historical-data.json');

    for (let item of data) {
        await historicalCollection.insertOne(item);
    }

    console.log('Historical data recovery complete');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
