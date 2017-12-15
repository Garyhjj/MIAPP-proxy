const requestOption = require('./requestOption')
const fs = require('fs');

module.exports ={
    requestOption,
    isReqError: (res) => (res && typeof res.statusCode === 'number') || (res.name === 'RequestError'),
    handlerError: async(ctx, next) => {
        try {
            await next();
        } catch (err) {
            const code = err.statusCode || err.status;
            if(!code) {
                fs.appendFileSync(`logs/error/${moment(new Date()).format('YYYYMMDD')}.log`,err);
            }
            ctx.response.status = code || 500;
            ctx.response.body = err.error || err.message;
        }
    };
}