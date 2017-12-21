const requestOption = require('./requestOption')
const fs = require('fs');

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
        return url;
    },
    isModuleAdmin(privilege, type) {
        return !!privilege.filter((i) => i.ROLE_NAME.indexOf(type.toUpperCase()) > -1).find((l) => l.FUNCTION_URL === 'CheckProblem');
    },
    isSuperUser(privilege, type) {
        return !!(privilege.find((l) => l.ROLE_NAME.indexOf(type.toUpperCase() + '_ADMIN') > -1))
    }
}