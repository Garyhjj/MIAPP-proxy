const request = require('request-promise-native');
const api = require('../../../../config/api/IPQA')
const replaceQuery = require('../../../../util/').replaceQuery;
module.exports = {
    getExcReportData: function(query,reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getExcReportData,query);
        return request.get(url,reqOpt);
    },
    getMriName(query,reqOpt) {
        query = query || {};
        let url = replaceQuery(api.getMriName,query);
        return request.get(url,reqOpt);
    }
}