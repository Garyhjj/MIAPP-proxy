const Router = require('koa-router'),
    request = require('request-promise-native'),
    config = require('./share/config/'),
    util = require('../../util'),
    reqOption = util.requestOption,
    isErr = util.isReqError,
    jwtCheck = require('../../middlewares/').jwtCheck,
    bossTipsCollection = require('./share/utils').bossTipsCollection;
    equipTipsCollection = require('./share/utils').equipTipsCollection,
    bossReq = require('./share/utils/boss-req/index'),
    IPQAReq = require('./share/utils/IPQA-req/');
    

var router = new Router({
    prefix: '/IPQA'
});

router.use(jwtCheck);

router.get('/adminTotalTips', async(ctx) => {
    let role = +ctx.query.role;
    let type = ctx.query.type;
    let res = 0;
    if(type === config.boss) {
        res = await bossTipsCollection.getAdminTotalTips(ctx,{role});
    }else if(type === config.equip) {
        res = await equipTipsCollection.getAdminTotalTips(ctx,{role});
    }
    ctx.response.body = res;
})

router.get('/ownUndoneReports', async(ctx) => {
    let query = ctx.query;
    let res = await bossReq.getOwnUndoneReport(query,ctx.miOption).toPromise();
    ctx.response.body = res;
})


router.get('/excIPQAReports', async(ctx) => {
    let query = ctx.query;
    let role = +query.role;
    let res;
    query.type = config.IPQA;
    if(role === 1) {
        res = await IPQAReq.getAdminExcReports(query,ctx.miOption).toPromise();
    }else {
        res = await IPQAReq.getNormalExcReports(query,ctx.miOption).toPromise();
    }
    ctx.response.body = res;
})

module.exports = router;