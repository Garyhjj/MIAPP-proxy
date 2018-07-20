const Router = require('koa-router'),
    request = require('request-promise-native'),
    util = require('../../util'),
    reqOption = util.requestOption,
    isErr = util.isReqError,
    jwtCheck = require('../../middlewares/').jwtCheck,
    baseReq = require('./share/utils/baseReq'),
    req = require('./share/utils/req/'),
    {
        ApiDescriptionGroup
    } = require('../../util/apiDescription');


var router = new Router({
    prefix: '/reservations'
});

const apiDescriptionGroup = new ApiDescriptionGroup(router);

router.use(jwtCheck);

apiDescriptionGroup.add({
    tip: '获得服务人员的需要查看的申请表',
    params: [{
            name: 'empno',
            type: 'string类型,工号，不传则返回全部',
            example: 'FX823'
        },
        {
            name: 'status',
            type: 'string类型, New | Processing',
            example: 'New'
        },
        {
            name: 'deptID',
            type: 'number类型， 1',
            example: 1
        }
    ],
    results: [{
        code: 200,
        fromTable: 'moa_services',
        dataIsArray: true
    }]
})
router.get('/applications/server', async (ctx) => {
    const query = ctx.query;
    const res = await req.getServerList(ctx.query, ctx.miOption);
    ctx.response.body = res;
})


apiDescriptionGroup.add({
    tip: '更新及插入服务，带插入及抢单验证',
    bodyFromTable: 'moa_services',
    results: [{
        code: 200,
        data: `number`
    }]
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