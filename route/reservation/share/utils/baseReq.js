const request = require('request-promise-native');
const api = require('../../../../config/api/reservation');
const replaceQuery = require('../../../../util/').replaceQuery;

module.exports = {
    getApplications: function (query, reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getApplications, query);
        return request.get(url, reqOpt).then((res) => {
            res = JSON.parse(res);
            if (!res) res = [];
            return res
        });
    },
    getPersonList(query, reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getPersonList, query);
        return request.get(url, reqOpt).then((res) => {
            res = JSON.parse(res);
            if (!res) res = [];
            return res
        });
    },
    async getDeptMes(query, reqOpt) {
        let res = await request.get(api.getDeptMes, reqOpt).then((res) => {
            res = JSON.parse(res);
            if (!res) res = [];
            return res
        });
        if(query.id > 0) {
            res = res.filter(d => d.ID === query.id);
        }
        return res;
    },
    getServiceDayInfo(query, reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getServiceDayInfo, query);
        return request.get(url, reqOpt).then((res) => {
            res = JSON.parse(res);
            if (!res) res = [];
            return res
        });
    },
    updateApplication(data, reqOpt) {
        return request({
            uri: api.updateApplication,
            method: 'POST',
            headers: reqOpt.headers,
            body: data,
            json: true
        }).then(res => JSON.parse(res));
    }
}