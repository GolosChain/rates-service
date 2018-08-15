const core = require('gls-core-service');
const MongoDB = core.service.MongoDB;

module.exports = MongoDB.makeModel(
    'Actual',
    {
        date: {
            type: String,
            required: true,
        },
        stamp: {
            type: Date,
            required: true,
        },
        rates: {
            type: Object,
            required: true,
        },
    },
    {
        index: [
            {
                fields: {
                    date: 1,
                },
            },
            {
                fields: {
                    stamp: -1,
                },
            },
        ],
    }
);
