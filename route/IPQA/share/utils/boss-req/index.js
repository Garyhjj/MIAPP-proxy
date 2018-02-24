const request = require('request-promise-native');
const baseReq = require('../baseReq');
const rxjs = require('rxjs');
const util = require('../../../../../util/');
const isArray = util.isArray;

module.exports = {
    getOwnUndoneReport(query, reqOption) {
        let Observable = rxjs.Observable;
        if (!query && !reqOption) return Observable.of([]);
        let problemStatus = ['Waiting', 'Highlight'];
        let query1 = Object.assign(JSON.parse(JSON.stringify(query)), {
            problemStatus: problemStatus[0]
        });
        let query2 = Object.assign(query, {
            problemStatus: problemStatus[1]
        });
        let getExcReportData = baseReq.getExcReportData;
        return Observable.forkJoin(Observable.fromPromise(getExcReportData(query1, reqOption)), Observable.fromPromise(baseReq.getExcReportData(query2, reqOption))).map((res) => res[0].concat(res[1]));
    },

    getTracProblems(query, reqOption) {
        return baseReq.getTracProblems(query, reqOption);
    },

    async getAttendanceInfo(query, reqOption) {
        const nameID = query.nameID;
        let res;
        if(!nameID) {
            const ids =  [2,3,4];
            const req = [];
            ids.forEach(i => {
                req.push(baseReq.getScheduleInfo(Object.assign({}, query, {nameID:i}), reqOption));
            })
            res =  await Promise.all(req).then(lists => {
                const all = [];
                lists.forEach(l => {
                    if(isArray(l)) {
                        all.push(...l);
                    }
                });
                return all;
            })
        }else {
            res = await baseReq.getScheduleInfo(query, reqOption);
        }
        if (isArray(res)) {
            const type = query.type;
            switch (+type) {
                case 1:
                    return res.filter(r => !r.ACUTAL_FROM_TIME || !r.ACTUAL_TO_TIME);
                case 2:
                    return res.filter(r => !r.ACTUAL_HOURS);
                case 3:
                    return res.filter(r => r.ACTUAL_HOURS);
                default:
                    return res;
            }
        } else {
            return []
        }
    },

    async getCommentInfo(query, reqOption) {
        let res =  await baseReq.getScheduleInfo(query, reqOption);
        const type = query.type;
        if (isArray(res)) {
            res = res.filter(r => r.HEADER_ID > 0);
            switch (+type) {
                case 0:
                    return res.filter(r => !r.SCORE);
                case 1:
                    return res.filter(r => r.SCORE);
                default:
                    return res;
            }
        } else {
            return []
        }
    }
}