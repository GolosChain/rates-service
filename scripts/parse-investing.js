const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

async function run(from, to) {
    const content = await fs.readFile(path.join(__dirname, `./${from}`), 'utf-8');

    const lines = content.split('\n');

    const data = {};

    for (let line of lines) {
        line = line.trim();

        if (!line) {
            continue;
        }

        const [dateCol, valueCol] = line.split(/\s+/);

        const date = moment(dateCol, 'DD.MM.YYYY').format('YYYY-MM-DD');

        data[date] = parseFloat(valueCol.replace(',', '.'));
    }

    await fs.writeFile(path.join(__dirname, to), JSON.stringify(data, null, 2));
}

run('data_USD-EUR.txt', 'usd-eur.json').catch(err => {
    console.error(err);
});

run('data_USD-RUB.txt', 'usd-rub.json').catch(err => {
    console.error(err);
});
