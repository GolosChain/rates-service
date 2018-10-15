const request = require('request-promise-native');

class Utils {
    static injectGolosGBGRate(quotes) {
        quotes.GBG.GOLOS = quotes.GBG.USD / quotes.GOLOS.USD;
        quotes.GOLOS.GBG = 1 / quotes.GBG.GOLOS;

        return quotes;
    }

    /*
     * Example of use:
     *   Utils.logSlackError('Some message', new Error('LOL WHAT?'));
     */

    static logSlackError(...items) {
        const lines = [];

        for (let item of items) {
            if (item) {
                const text = item && item.stack ? '```\n' + item.stack + '\n```' : String(item);

                if (text) {
                    lines.push(text);
                }
            }
        }

        let text;

        if (lines.length) {
            text = lines.join('\n');
        } else {
            text = '<EMPTY>';
        }

        request({
            url: 'https://hooks.slack.com/services/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',
            method: 'POST',
            json: true,
            body: {
                text,
                icon_emoji: ':derp:',
                username: 'rates-service',
            },
        }).catch(err => console.error(err.message));
    }
}

module.exports = Utils;
