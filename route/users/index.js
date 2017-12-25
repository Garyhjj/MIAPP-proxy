const Router = require('koa-router'),
    request = require('request-promise-native'),
    config = require('../../config/base'),
    util = require('../../util'),
    reqOption = util.requestOption,
    isErr = util.isReqError,
    jwtCheck = require('../../middlewares/').jwtCheck,
    getAllTips = require('../share/utils/index').getAllTips;

var router = new Router({
    prefix: '/users'
});

router.use(jwtCheck);

router.post('/tips', async(ctx) => {
    let a = await getAllTips.getNewTips(ctx);
    ctx.response.body = a;
})

module.exports = router;