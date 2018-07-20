const Router = require('koa-router'),
    jwtCheck = require('../../middlewares/').jwtCheck,
    getAllTips = require('../share/utils/index').getAllTips,
    {
        ApiDescriptionGroup
    } = require('../../util/apiDescription');

var router = new Router({
    prefix: '/users'
});

const apiDescriptionGroup = new ApiDescriptionGroup(router);

router.use(jwtCheck);

apiDescriptionGroup.add({
    tip: '获得所有模块的提示数',
    body: `
{
    empno:string,
    company_name:string,
    moduleId: number[]
}`,
    results: [{
        code: 200,
        data: `非负整数`
    }],
    body_example: `
{
    empno:FX823,
    company_name:MSL,
    moduleId:[61,22]
}`,
})
router.post('/tips', async (ctx) => {
    let a = await getAllTips.getNewTips(ctx);
    ctx.response.body = a;
})

module.exports = router;