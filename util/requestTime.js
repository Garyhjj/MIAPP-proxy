const moment = require('moment');

const dateFormat = 'YYYYMMDD';
class RequestMonitor {
    constructor() {
        this.requestCount = Object.create(null);
        this.requestAverageTime = Object.create(null);
        this.requestTimeRange = Object.create(null);
        this.userList = new Set();
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
    updateUserList(userID) {
        this.userList.add(userID);
    }
    getUserList() {
        return Array.from(this.userList);
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

function requestMonitorFactory() {

}
requestMonitorFactory.updateTime = function (path, during) {
    const old = requestTimeList.find(r => r.date === moment().format(dateFormat));
    if (old) {
        old.updateTime(path, during);
    } else {
        const newOne = new RequestMonitor();
        requestTimeList.unshift(newOne);
        newOne.updateTime(path, during);
    }
}
requestMonitorFactory.searchRequestMonitorByDate = function (date) {
    date = date || moment().format(dateFormat);
    return requestTimeList.find(r => r.date === date);
}
requestMonitorFactory.getStatisticsByAPI = function (date) {
    const target = this.searchRequestMonitorByDate(date);
    return target ? target.getStatisticsByAPI() : [];
}
requestMonitorFactory.getStatisticsByTime = function (date) {
    const target = this.searchRequestMonitorByDate(date);
    return target ? target.getStatisticsByTime() : [];
}
requestMonitorFactory.getUserList = function (date) {
    const target = this.searchRequestMonitorByDate(date);
    return target ? target.getUserList() : [];
}
requestMonitorFactory.updateUserList = function (userID) {
    const old = requestTimeList.find(r => r.date === moment().format(dateFormat));
    if (old) {
        old.updateUserList(userID);
    } else {
        const newOne = new RequestMonitor();
        requestTimeList.unshift(newOne);
        newOne.updateUserList(userID);
    }
}
module.exports = requestMonitorFactory;