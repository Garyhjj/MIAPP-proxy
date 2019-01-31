const Router = require("koa-router"),
    jwtCheck = require("../../middlewares/").jwtCheck,
    shippingTable = require('../../tables/board/shipping'),
    cvteLines = require('../../tables/board/sfcs_operation_lines'),
    cvteOperations = require('../../tables/board/sfcs_operations'),
    {
        ApiDescriptionGroup
    } = require('../../util/apiDescription'),
    boardUtil = require('./share/utils');

var router = new Router({
    prefix: "/boards"
});

const apiDescriptionGroup = new ApiDescriptionGroup(router);

router.use(jwtCheck);

apiDescriptionGroup.add({
    tip: '获得产出VS计划的信息',
    params: [{
            name: 'deptno',
            type: '部门简称',
            example: 'MDI'
        },
        {
            name: 'ofder',
            type: 'ofd的英文名',
            example: 'gary.h'
        }
    ],
    results: [{
        code: 200,
        fromTable: shippingTable.tableName
    }]
})
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

apiDescriptionGroup.add({
    tip: '获得产出VS计划的信息里可选的部门简称',
    params: [],
    results: [{
        code: 200,
        data: `{
  DEPT_SHORTNAME: string
}[]
      `
    }]
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
apiDescriptionGroup.add({
    tip: '获得CVTE車載產品的线别列表',
    params: [],
    results: [{
        code: 200,
        fromTable: cvteLines.tableName
    }]
})
router.get('/cvte/lines', async ctx => {
    let err, data;
    data = await cvteLines.search().catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

apiDescriptionGroup.add({
    tip: '获得CVTE車載產品的工位信息',
    params: [],
    results: [{
        code: 200,
        fromTable: cvteOperations.tableName
    }]
})
router.get('/cvte/operations', async ctx => {
    let err, data;
    data = await cvteOperations.search().catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

apiDescriptionGroup.add({
    tip: '获得CVTE車載產品的头部信息',
    params: [],
    results: [{
        code: 200,
        data: `{
    LINE_ID: number;
    MODEL: string;
    PART_NO: string;
    WO_NO: string;
    operations: number[];
    BODYS1: any
    BODYS2: any
}
        `
    }]
})
router.get('/cvte', async ctx => {
    let err, data, opList;
    const {
        operations,
        line_id
    } = ctx.query;
    if (operations) {
        opList = operations.split(',').filter(a => a).map(a => +a);
    }
    if (!opList || opList.length === 0) {
        err = '工序不能为空'
    } else {
        data = await boardUtil.getCvteHeaders(ctx.query).then((headers) => {
            const req = [];
            headers.forEach(h => {
                h.operations = opList;
                opList.forEach((o) => {
                    req.push(boardUtil.getCvteBody1({
                        op_id: o,
                        wo_id: h.WO_ID,
                        line_id
                    }).then((bh) => {
                        h.BODYS1 = h.BODYS1 || {};
                        h.BODYS1[o] = bh[0]
                    }))
                    req.push(boardUtil.getCvteBody2({
                        op_id: o,
                        wo_id: h.WO_ID,
                        line_id
                    }).then((bh) => {
                        h.BODYS2 = h.BODYS2 || {};
                        h.BODYS2[o] = bh
                    }))
                })
            })
            return Promise.all(req).then(() => headers);
        }).catch((e) => {
            err = e.message ? e.message : e;
        });
    }
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

module.exports = router;