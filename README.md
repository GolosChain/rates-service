## Golos rates service

### Api methods:

#### getActual

result:
```
{
    "rates": {
        "GBG": {
            "USD": 0.035273075138,
            "EUR": 0.031100481987625495,
            "RUB": 2.3808126433595254
        },
        "GOLOS": {
            "USD": 0.0317137604099,
            "EUR": 0.02796221283597135,
            "RUB": 2.1405710008828516
        }
    }
```

#### getHistorical
params:
* date - Дата в формате "YYYY-MM-DD"

result:
```
{
    "date": "2018-08-13",
    "rates": {
        "GBG: {...},
        "GOLOS: {...},
    }
}
```

#### getHistoricalMulti
params:
* dates - Массив дат в формате "YYYY-MM-DD"

result:
```
{
    items: [
        {
            "date": "2018-08-13",
            "rates": {
                "GBG: {...},
                "GOLOS: {...},
            }
        },
        {
            "date": "2018-08-14",
            "rates": {
                "GBG: {...},
                "GOLOS: {...},
            }
        },
        ...
    ]
}
```