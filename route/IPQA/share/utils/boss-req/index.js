const request = require('request-promise-native');
const baseReq = require('../baseReq');
const rxjs = require('rxjs');

module.exports = {
    getOwnUndoneReport(query,reqOption){
        let Observable = rxjs.Observable;
        if(!query && !reqOption) return Observable.of([]);
        let problemStatus = ['Waiting', 'Highlight'];
        let query1 = Object.assign(JSON.parse(JSON.stringify(query)),{problemStatus:problemStatus[0]});
        let query2 = Object.assign(query,{problemStatus:problemStatus[1]});
        let getExcReportData = baseReq.getExcReportData;
        return Observable.forkJoin(Observable.fromPromise(getExcReportData(query1,reqOption)),Observable.fromPromise(baseReq.getExcReportData(query2,reqOption))).map((res) => res[0].concat(res[1]));
    },

    getTracProblems(query,reqOption) {
        return baseReq.getTracProblems(query, reqOption);
    }
}