const request = require("request-promise-native");
const baseReq = require("../baseReq");
const rxjs = require("rxjs");

module.exports = {
  getNormalExcReports(query, reqOption) {
    let Observable = rxjs.Observable;
    if (!query && !reqOption) return Observable.of([]);
    let baseQuery = {
      type: query.type,
      company_name: query.company_name
    };
    let problemStatus = ["New", "Waiting", "WaitingBoss", "WaitingQA", "Done"],
      getExcReportDataWaiting = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[1],
            empno: query.empno
          },
          baseQuery
        ),
        reqOption
      ),
      getExcReportDataWaitingBoss = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[2],
            boss_empno: query.empno
          },
          baseQuery
        ),
        reqOption
      ),
      getExcReportDataWaitingQA = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[3],
            qa_empno: query.empno
          },
          baseQuery
        ),
        reqOption
      ),
      getExcReportDataDone = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[4],
            closer_empno: query.empno
          },
          baseQuery
        ),
        reqOption
      );
    return Observable.forkJoin(
      getExcReportDataWaiting,
      getExcReportDataWaitingBoss,
      getExcReportDataWaitingQA,
      getExcReportDataDone
    ).map(res => res.reduce((a, b) => a.concat(b)));
  },
  getAdminExcReports(query, reqOption) {
    let Observable = rxjs.Observable;
    if (!query && !reqOption) return Observable.of([]);
    let baseQuery = {
      type: query.type,
      company_name: query.company_name
    };
    let problemStatus = ["New", "Waiting", "WaitingBoss", "WaitingQA", "Done"],
      getExcReportDataNew = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[0],
            empno: ""
          },
          baseQuery
        ),
        reqOption
      ),
      getExcReportDataWaiting = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[1],
            empno: ""
          },
          baseQuery
        ),
        reqOption
      ),
      getExcReportDataWaitingBoss = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[2],
            empno: ""
          },
          baseQuery
        ),
        reqOption
      ),
      getExcReportDataWaitingQA = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[3],
            empno: ""
          },
          baseQuery
        ),
        reqOption
      ),
      getExcReportDataDone = baseReq.getExcReportData(
        Object.assign(
          {
            problemStatus: problemStatus[4],
            empno: ""
          },
          baseQuery
        ),
        reqOption
      );
    return Observable.forkJoin(
      getExcReportDataNew,
      getExcReportDataWaiting,
      getExcReportDataWaitingBoss,
      getExcReportDataWaitingQA,
      getExcReportDataDone
    ).map(res => res.reduce((a, b) => a.concat(b)));
  },
  GetHeaderLinesReport(data, reqOption) {
    return baseReq.GetHeaderLinesReport(data, reqOption);
  },
  UploadReport(data, reqOption) {
    return baseReq.UploadReport(data, reqOption);
  },
  getReportData(headerId, reqOption) {
    return baseReq.getReportData(headerId, reqOption);
  }
};
