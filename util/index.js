const requestOption = require('./requestOption')
const fs = require('fs');



const isModuleAdmin = function(privilege, type) {
    if(privilege === void 0) return false;
    if(type === void 0) return false;
    if(!(privilege instanceof Array)) return false;
    return !!privilege.filter((i) => i.ROLE_NAME.indexOf(type.toUpperCase()) > -1).find((l) => l.FUNCTION_URL === 'CheckProblem');
}

const isSuperUser = function(privilege, type) {
    if(privilege === void 0) return false;
    if(type === void 0) return false;
    if(!(privilege instanceof Array)) return false;
    return !!(privilege.find((l) => l.ROLE_NAME.indexOf(type.toUpperCase() + '_ADMIN') > -1))
}

module.exports = {
    requestOption,
    isReqError: (res) => (res && typeof res.statusCode === 'number') || (res.name === 'RequestError'),
    handlerError: async(ctx, next) => {
        try {
            await next();
        } catch (err) {
            const code = err.statusCode || err.status;
            if (!code) {
                fs.appendFileSync(`logs/error/${moment(new Date()).format('YYYYMMDD')}.log`, err);
            }
            ctx.response.status = code || 500;
            ctx.response.body = err.error || err.message;
        }
    },
    replaceQuery: function (url, query) {
        for (let prop in query) {
            url = url.replace(`{${prop}}`, query[prop])
        }
        url = url.replace(/\{\w+\}/g,'');
        return url;
    },
    isModuleAdmin,
    isSuperUser,
    getRole: (privilege, type) => {
        // 1超级管理员，2普通管理员，3普通使用者
        if(isSuperUser(privilege, type)){
            return 1
        }else if(isModuleAdmin(privilege, type)) {
            return 2
        }else {
            return 3
        }
        
    }
}