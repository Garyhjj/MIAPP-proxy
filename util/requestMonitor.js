const moment = require('moment'),
    monitorsTable = require('../tables/system/moa_end_monitors');

const dateFormat = 'YYYY-MM-DD';

class RequestRouteMessage {
    constructor(path) {
        this.p = path;
        this.l = [];
    }
    update(way, during) {
        const old = this.l.find(l => Array.isArray(l) && l[0] === way);
        if (old) {
            const averageTime = old[2],
                count = old[1];
            old[2] = ((averageTime * count + during) / (count + 1)).toFixed(2);
            old[1]++;
        } else {
            this.l.push([way, 1, during]);
        }
    }
}
class RequestMonitor {
    constructor() {
        this.ls = [];
        this.requestTimeRange = Object.create(null);
        this.userList = new Set();
        this.date = moment().format(dateFormat);
        this.isStored = false;
    }

    updateTime(path, during) {
        if (typeof path === 'string' && path && during > 0) {
            const nowTime = moment().format('HH');
            this.requestTimeRange[nowTime] = this.requestTimeRange[nowTime] ? this.requestTimeRange[nowTime] + 1 : 1
            const [way, truePath] = path.split(':');
            let old = this.ls.find(l => l.p === truePath);
            if (old) {
                if (typeof old.update !== 'function') {
                    old = Object.assign(new RequestRouteMessage(old.p), old);
                }
                old.update(way, during);
            } else {
                const nRrm = new RequestRouteMessage(truePath);
                nRrm.update(way, during);
                this.ls.push(nRrm);
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
        const list = [];
        this.ls.forEach((r) => {
            if (Array.isArray(r.l)) {
                r.l.forEach(_ => {
                    list.push({
                        name: _[0] + ':' + r.p,
                        count: _[1],
                        averageTime: _[2]
                    })
                })
            }
        })
        // 兼容数据库的旧数据
        const count = this.requestCount;
        const averageTime = this.requestAverageTime;
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

function initRequestTimeList() {
    monitorsTable.search().then((res) => {
        let has = Object.create(null);
        res = res.filter(r => {
            const date = r.MONITOR_DATE;
            if (!has[date]) {
                has[date] = true;
                return true;
            } else {
                return false;
            }
        })
        if (Array.isArray(res)) {
            res.forEach(r => {
                const body = r.MONITOR_BODY;
                for (let i = 1; i < 4; i++) {
                    if (Array.isArray(r['MORE_ROUTES' + i])) {
                        body.ls = body.ls.concat(r['MORE_ROUTES' + i]);
                    }
                }
                requestTimeList.push(Object.assign(new RequestMonitor(), body, {
                    isStored: true
                }))
            })
        }
    }).catch(err => console.error(err))
}

initRequestTimeList();

function requestMonitorFactory() {

}
requestMonitorFactory.updateTime = function (path, during) {
    const nowDate = moment().format(dateFormat);
    const old = requestTimeList.find(r => r.date === nowDate);
    if (old) {
        old.updateTime(path, during);
    } else {
        const beforeAndNotStored = requestTimeList.filter(r => !r.isStored && moment(r.date, dateFormat).isBefore(moment(nowDate, dateFormat)));
        beforeAndNotStored.forEach((l) => {
            const ls = l.ls;
            let more1 = [],
                more2 = [],
                more3 = [];
            if (ls.length > 55) {
                l.ls = ls.slice(0, 55);
                more1 = ls.slice(55);
            }
            if (more1.length > 60) {
                more2 = more1.slice(60);
                more1 = more1.slice(0, 60);

            }
            if (more2.length > 60) {
                more3 = more2.slice(60);
                more2 = more2.slice(0, 60);
            }
            if (more3.length > 60) {
                more3 = more3.slice(0, 60);
                console.error('路由过多，已丢失多余数据，请及时调整')
                l.hasMissed = true;
            }
            l.userList = Array.from(l.userList);
            monitorsTable.update({
                MONITOR_DATE: l.date,
                MONITOR_BODY: l,
                MORE_ROUTES1: more1,
                MORE_ROUTES2: more2,
                MORE_ROUTES3: more3
            }, -1).then(() => {
                l.isStored = true;
            }).catch((err) => console.error(err))
        })
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