const Router = require('koa-router'),
    request = require('request-promise-native'),
    config = require('../../config/base'),
    util = require('../../util'),
    reqOption = util.requestOption,
    isErr = util.isReqError,
    jwtCheck = require('../../middlewares/').jwtCheck;

var router = new Router({
    prefix: '/IPQA'
});

router.use(jwtCheck);

router.get('/GetMachineCheckList', async(ctx) => {
    let a = await request.get(config.proxy + ctx.request.url, reqOption(ctx)).catch(err =>err);
    if (isErr(a)) {
        ctx.response.status = a.statusCode || 400;
        ctx.response.body = a.error;
    } else {
        ctx.response.body = a;
    }
})

module.exports = router;