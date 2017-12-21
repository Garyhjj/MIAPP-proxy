const request = require('request-promise-native');
const baseReq = require('../baseReq');
const requestOption = require('../../../../../util/requestOption');
const rxjs = require('rxjs');

module.exports = {
    getOwnUndoneReport: (ctx) => {
        if(!ctx) return;
        query = ctx.request.body || {};
        ctx.reqOpt = requestOption(ctx);
        let problemStatus = ['Waiting', 'Highlight'];
        ctx.query1 = Object.assign(query,{problemStatus:problemStatus[0]});
        ctx.query2 = Object.assign(query,{problemStatus:problemStatus[1]});
        let getExcReportData = baseReq.getExcReportData;
        let Observable = rxjs.Observable;
        return Observable.forkJoin(Observable.fromPromise(getExcReportData(ctx.query1,ctx.reqOpt)),Observable.fromPromise(baseReq.getExcReportData(ctx.query2,ctx.reqOpt)));
    } 
}