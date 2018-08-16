const core = require('gls-core-service');
const MongoDB = core.service.MongoDB;

module.exports = MongoDB.makeModel(
    'Historical',
    {
        date: {
            type: String,
            required: true,
        },
        rates: {
            type: Object,
            required: true,
        },
    },
    {
        index: [
            // Индекс для выборки (+ уникальность записей)
            {
                fields: {
                    date: -1,
                },
                options: {
                    unique: true,
                },
            },
        ],
    }
);
