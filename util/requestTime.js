const moment = require('moment');

const dateFormat = 'YYYYMMDD';
class RequestTime {
    constructor() {
        this.requestCount = Object.create(null);
        this.requestAverageTime = Object.create(null);
        this.requestTimeRange = Object.create(null);
        this.date = moment().format(dateFormat);
    }

    updateTime(path, during) {
        if (typeof path === 'string' && path && during > 0) {
            const nowTime = moment().format('HH');
            this.requestTimeRange[nowTime] = this.requestTimeRange[nowTime] ? this.requestTimeRange[nowTime] + 1 : 1
            if (this.requestCount[path] > 0) {
                const averageTime = this.requestAverageTime[path];
                this.requestAverageTime[path] = averageTime > 0 ? +((averageTime * this.requestCount[path] + during) / (averageTime + 1)).toFixed(2) : averageTime;
                this.requestCount[path]++;
            } else {
                this.requestCount[path] = 1;
                this.requestAverageTime[path] = during;
            }
        }
    }
    getStatisticsByAPI() {
        const count = this.requestCount;
        const averageTime = this.requestAverageTime;
        const list = [];
        for (let prop in count) {
            list.push({
                name: prop,
                count: count[prop],
                averageTime: averageTime[prop]
            });
        }
        return list;
    }
    getStatisticsByTime() {
        const range = this.requestTimeRange;
        const list = [];
        for (let prop in range) {
            list.push({
                hour: prop,
                count: range[prop]
            });
        }
        return list.sort((a, b) => a.hour - b.hour);
    }
}

const requestTimeList = []

function requestTimeFactory() {

}
requestTimeFactory.updateTime = function (path, during) {
    const old = requestTimeList.find(r => r.date === moment().format(dateFormat));
    if (old) {
        old.updateTime(path, during);
    } else {
        const newOne = new RequestTime();
        requestTimeList.unshift(newOne);
        newOne.updateTime(path, during);
    }
}
requestTimeFactory.searchRequestTimeByDate = function (date) {
    date = date || moment().format(dateFormat);
    return requestTimeList.find(r => r.date === date);
}
requestTimeFactory.getStatisticsByAPI = function (date) {
    const target = this.searchRequestTimeByDate(date);
    return target ? target.getStatisticsByAPI() : [];
}
requestTimeFactory.getStatisticsByTime = function (date) {
    const target = this.searchRequestTimeByDate(date);
    return target ? target.getStatisticsByAPI() : [];
}
module.exports = requestTimeFactory;