const core = require('gls-core-service');
const Main = require('./Main');

const Logger = core.Logger;

new Main().start().then(
    () => {
        Logger.info('Main service started!');
    },
    error => {
        Logger.error(`Main service failed - ${error}`);
        process.exit(1);
    }
);
