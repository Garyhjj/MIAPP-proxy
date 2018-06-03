const request = require("request-promise-native");
const api = require("../../../../config/api/IPQA");
const replaceQuery = require("../../../../util/").replaceQuery;
module.exports = {
  getExcReportData: function (query, reqOpt) {
    query = query || {};
    let url = replaceQuery(api.getExcReportData, query);
    return request.get(url, reqOpt).then(res => {
      res = JSON.parse(res);
      if (!res) res = [];
      return res;
    });
  },
  getMriName(query, reqOpt) {
    query = query || {};
    let url = replaceQuery(api.getMriName, query);
    return request.get(url, reqOpt).then(res => JSON.parse(res));
  },
  getProblemTrack(query, reqOpt) {
    query = query || {};
    let url = replaceQuery(api.getProblemTrack, query);
    return request.get(url, reqOpt).then(res => {
      res = JSON.parse(res);
      if (!res) res = [];
      return res;
    });
  },
  getEmployeeSchedule(query, reqOpt) {
    query = query || {};
    let url = replaceQuery(api.getEmployeeSchedule, query);
    return request.get(url, reqOpt).then(res => JSON.parse(res));
  },

  getTracProblems(query, reqOpt) {
    query = query || {};
    let url = replaceQuery(api.getProblemTrack, query);
    return request.get(url, reqOpt).then(res => JSON.parse(res));
  },

  getLinesById(query, reqOpt) {
    query = query || {};
    let url = replaceQuery(api.getLinesById, query);
    return request.get(url, reqOpt).then(res => JSON.parse(res));
  },

  getScheduleInfo(query, reqOpt) {
    query = query || {};
    let url = replaceQuery(api.getScheduleInfo, query);
    return request.get(url, reqOpt).then(res => JSON.parse(res));
  },

  GetHeaderLinesReport(data, reqOpt) {
    return request({
      uri: api.GetHeaderLinesReport,
      method: "POST",
      headers: reqOpt.headers,
      body: data,
      json: true
    }).then(res => JSON.parse(res));
  },
  UploadReport(data, reqOpt) {
    return request({
      uri: api.UploadReport,
      method: "POST",
      headers: reqOpt.headers,
      body: data,
      json: true
    }).then(res => JSON.parse(res));
  },
  getReportData(headerId, reqOpt) {
    return request
      .get(api.getReportData + `?header_id=${headerId}`, reqOpt)
      .then(res => JSON.parse(res));
  },
  uploadMachineHdr(data, reqOpt) {
    return request({
      uri: api.uploadMachineHdr,
      method: "POST",
      headers: reqOpt.headers,
      body: data,
      json: true
    }).then(res => res);
  }
};