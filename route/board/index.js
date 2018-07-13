const Router = require("koa-router"),
    jwtCheck = require("../../middlewares/").jwtCheck,
    shippingTable = require('../../tables/board/shipping');

var router = new Router({
    prefix: "/boards"
});

router.use(jwtCheck);

router.get('/shipping', async ctx => {
    let query = ctx.query;
    let err, data;
    data = await shippingTable.search(query).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})
router.get('/shipping/departments', async ctx => {
    let err, data;
    data = await shippingTable.getDeptShortNameList().catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

module.exports = router;