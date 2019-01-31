const {
    EasyRouter,
    getQuery,
    getBody,
    getUserID,
    getCtx
} = require('../../util/easyRouter'),
    jwtCheck = require('../../middlewares/').jwtCheck,
    getAllTips = require('../share/utils/index').getAllTips, {
        ApiDescriptionGroup,
    } = require('../../util/apiDescription'), {
        hasOwn
    } = require('../../util'),
    request = require("request-promise-native");

var router = new EasyRouter({
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
router.setAgs(getCtx)
router.post('/tips', async (ctx) => {
    let a = await getAllTips.getNewTips(ctx);
    ctx.response.body = a;
})

router.setAgs(getBody)
router.post("/tgt", async (body) => {
    const {
        username,
        password
    } = body;
    if (username && password) {
        const xml = await request.post('https://login1.mic.com.tw/mic-cas-server/v1/tickets', {
            form: {
                username,
                password
            }
        });
        const reg = /(\w+)\s*=\s*"(.*?)"/g;
        while (reg.exec(xml)) {
            // console.log(RegExp.$1)
            if (RegExp.$1 === 'action') {
                const all = RegExp.$2;
                const tgt = all.split('/').pop();
                console.log(tgt)
                return {
                    tgt
                };
            }
        }
    } else {
        return Promise.reject('无效个人信息');
    }


});

module.exports = router;