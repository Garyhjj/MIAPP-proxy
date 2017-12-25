const jwtCheck = require('./jwtCheck');
const requestOption = require('../util/requestOption');

module.exports = {
    jwtCheck,
    prepareReqOption:(ctx,next) =>{
        ctx.miOption = requestOption(ctx);
        return next();
    }
}