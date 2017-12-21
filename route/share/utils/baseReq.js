const request = require('request-promise-native');
const guid = require('../../../config/api/guid');

module.exports = {
    getPrivilege: (moduleId,reqOpt) => {
        return request.get(guid.getPrivilegeUrl.replace('{moduleID}',moduleId),reqOpt);
    } 
}