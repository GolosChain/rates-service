
function balancedAvg(list, cutRate = 0.9) {
    list.sort();

    const maxIndex = list.length - 1;

    const indexStart = Math.floor(maxIndex * (1 - cutRate));
    const indexEnd = Math.ceil(maxIndex * cutRate);

    let sum = 0;

    for (let i = indexStart; i <= indexEnd; ++i) {
        sum += list[i];
    }

    console.log(sum, indexEnd, indexStart);

    return sum / (indexEnd - indexStart + 1);
}

module.exports = {
    balancedAvg,
};
