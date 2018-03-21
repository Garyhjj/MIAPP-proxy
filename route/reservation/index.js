const Router = require('koa-router'),
    request = require('request-promise-native'),
    util = require('../../util'),
    reqOption = util.requestOption,
    isErr = util.isReqError,
    jwtCheck = require('../../middlewares/').jwtCheck,
    baseReq = require('./share/utils/baseReq'),
    req = require('./share/utils/req/');


var router = new Router({
    prefix: '/reservations'
});

router.use(jwtCheck);

router.get('/applications/server', async (ctx) => {
    const query = ctx.query;
    res = await req.getServerList(ctx.query, ctx.miOption);
    ctx.response.body = res;
})

module.exports = router;