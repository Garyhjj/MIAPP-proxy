const jwt = require('jsonwebtoken');

function jwtCheck(ctx, next) {
    let token = ctx.request.headers.access_token;
    let errMes,
        decode
    if (!token) {
        errMes = '未授权';
    }    
    // if (!token || !(decode = jwt.decode(token))){
    //     errMes = '未授权';
    // }else if(new Date(0).setUTCMilliseconds(decode.exp) < new Date()) {
    //     errMes = '授权身份已超时';
    // }
    if (errMes) {
        ctx.response.status = 401;
        ctx.response.body = errMes;
    } else {
        return next();
    }
}

module.exports = jwtCheck;