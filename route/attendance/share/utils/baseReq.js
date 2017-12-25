const request = require('request-promise-native');
const api = require('../../../../config/api/attendance')
const replaceQuery = require('../../../../util/').replaceQuery;

module.exports = {
    getOffDutyException: function (reqOpt) {
        return request.get(api.getOffDutyException, reqOpt).then((res) => {
            res = JSON.parse(res);
            if (!res) res = [];
            return res
        });
    }
}