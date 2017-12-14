const Router = require('koa-router'),
    request = require('request-promise-native'),
    config = require('../../config/base'),
    reqOption = require('../../util/requestOption');

var router = new Router({
    prefix: '/OverTime'
});
router.get('/GetOverTimeTotalHours', async (ctx) => {
    console.log(ctx.request.url);
    let a = await request.get(config.proxy + ctx.request.url, reqOption(ctx)).catch(err => {
        ctx.response.status = 500;
        ctx.respond.message = 456;
        console.log(err)});
    ctx.response.body = a;
})

module.exports = router;