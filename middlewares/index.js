const jwtCheck = require('./jwtCheck');
const requestOption = require('../util/requestOption'),
    requestTime = require('../util').requestTime;
module.exports = {
    jwtCheck,
    prepareReqOption: (ctx, next) => {
        ctx.miOption = requestOption(ctx);
        return next();
    },
    recordTime: async (ctx, next) => {
        let {
            path,
            method
        } = ctx;
        if (typeof method !== 'string' || method.toUpperCase() === 'OPTIONS' || typeof path !== 'string' || path.indexOf('.') > -1) {
            return next();
        }
        path = path.split('?')[0];
        ctx.beginPathTime = new Date().getTime();
        await next();
        requestTime.updateTime(method + ': ' + path, new Date().getTime() - ctx.beginPathTime);
    }
}