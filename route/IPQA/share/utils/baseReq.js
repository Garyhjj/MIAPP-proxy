const request = require('request-promise-native');
const api = require('../../../../config/api/IPQA')
const replaceQuery = require('../../../../util/').replaceQuery;
module.exports = {
    getExcReportData: function (query, reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getExcReportData, query);
        return request.get(url, reqOpt).then((res) => {
            res = JSON.parse(res);
            if (!res) res = [];
            return res
        });
    },
    getMriName(query, reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getMriName, query);
        return request.get(url, reqOpt).then((res) => JSON.parse(res));
    },
    getProblemTrack(query, reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getProblemTrack, query);
        return request.get(url, reqOpt).then((res) => {
            res = JSON.parse(res);
            if (!res) res = [];
            return res
        });
    },
    getEmployeeSchedule(query, reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getEmployeeSchedule, query);
        return request.get(url,reqOpt).then((res) => JSON.parse(res));
    }
}