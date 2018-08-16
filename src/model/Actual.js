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
            // Индекс для выборки при удалении старых дат
            {
                fields: {
                    date: 1,
                },
            },
            // Индекс для выборки последней записи
            {
                fields: {
                    stamp: -1,
                },
            },
        ],
    }
);
