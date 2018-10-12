class Utils {
    static injectGolosGBGRate(quotes) {
        quotes.GBG.GOLOS = quotes.GBG.USD / quotes.GOLOS.USD;
        quotes.GOLOS.GBG = 1 / quotes.GBG.GOLOS;

        return quotes;
    }
}

module.exports = Utils;
