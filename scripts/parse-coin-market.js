const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

const allDates = new Map();

let usdEur;
let usdRub;

async function parse(currency) {
    const content = await fs.readFile(path.join(__dirname, `data_${currency}-USD.txt`), 'utf-8');

    const lines = content.split('\n');

    for (let line of lines) {
        line = line.trim();

        if (!line) {
            continue;
        }

        const [dateCol, , , , closeCol] = line.split('\t');

        const date = moment(dateCol, 'MMM DD, YYYY').format('YYYY-MM-DD');
        const close = parseFloat(closeCol);

        if (date < '2017-02-13') {
            continue;
        }

        let dateData = allDates.get(date);

        if (!dateData) {
            dateData = {
                GOLOS: {},
                GBG: {},
            };
            allDates.set(date, dateData);
        }

        dateData[currency].USD = close;
        dateData[currency].EUR = close * findNear(usdEur, date);
        dateData[currency].RUB = close * findNear(usdRub, date);
    }
}

async function run() {
    usdEur = require('./usd-eur.json');
    usdRub = require('./usd-rub.json');

    await parse('GOLOS');
    await parse('GBG');

    const list = [];

    for (let date of [...allDates.keys()].sort()) {
        const rates = allDates.get(date);

        list.push({
            date,
            rates,
        });
    }

    await fs.writeFile(
        path.join(__dirname, '../data/historical-data.json'),
        JSON.stringify(list, null, 2) + '\n'
    );
}

function findNear(data, date) {
    let value = data[date];

    if (value) {
        return value;
    }

    for (let i = 1; i < 20; ++i) {
        const prevDay = moment(date, 'YYYY-MM-DD')
            .subtract(i, 'day')
            .format('YYYY-MM-DD');

        value = data[prevDay];

        if (value) {
            return value;
        }
    }

    console.error("Can't find value for date", date);
}

run().catch(err => {
    console.error(err);
});
