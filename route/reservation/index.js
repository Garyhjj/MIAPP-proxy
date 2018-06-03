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
    const res = await req.getServerList(ctx.query, ctx.miOption);
    ctx.response.body = res;
})

router.post('/applications', async (ctx) => {
    const query = ctx.request.body;
    let res;
    if (Array.isArray(query)) {
        res = await Promise.all(query.map(q => req.updateApplication(query, ctx.miOption))).catch(err => err);
    } else {
        res = await req.updateApplication(query, ctx.miOption).catch(err => err);
    }
    if (res.statusCode > 0) {
        ctx.response.status = res.statusCode;
        ctx.response.body = res.error;
    } else if (isErr(res)) {
        ctx.response.status = 400;
        ctx.response.body = res.message;
    } else {
        ctx.response.body = res;
    }
})

module.exports = router;