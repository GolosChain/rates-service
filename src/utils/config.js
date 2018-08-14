const config = require('config');

function get(key) {
    const envValue = process.env[key];

    if (envValue != null) {
        return envValue;
    }

    return config.get(key);
}

module.exports = {
    get,
};
