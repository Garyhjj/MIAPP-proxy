const {
    EasyRouter,
    getQuery,
    getBody,
    getUserID
} = require('../../util/easyRouter'),
    jwtCheck = require('../../middlewares/').jwtCheck,
    util = require('../../util'),
    reductionTable = require('../../tables/tax/moa_tax_reduction'), {
        ApiDescriptionGroup
    } = require('../../util/apiDescription'),
    reductionUtil = require('./share'),
    settingTable = require('../../tables/tax/moa_tax_setting'),
    detailTable = require('../../tables/tax/moa_tax_reduction_detail');

var router = new EasyRouter({
    prefix: "/taxes"
});

router.use(jwtCheck);

const apiDescriptionGroup = new ApiDescriptionGroup(router);

apiDescriptionGroup.add({
    tip: '获得扣税明细',
    //   params: [{
    //       name: 'fromDate',
    //       type: '日期',
    //       example: '2017/12/31'
    //     },
    //     {
    //       name: 'endDate',
    //       type: '日期',
    //       example: '2018/1/31'
    //     }
    //   ],
    results: [{
        code: 200,
        fromTable: 'MOA_TAX_REDUCTION'
    }]
})

router.setAgs(getQuery);
router.get("/reduction", async (query) => {
    let result = await reductionTable.search(query)
    return result;
});

router.setAgs(getQuery);
router.get("/reduction/lastest", async (query) => {
    const {
        user_id,
        type,
        company_name
    } = query;
    let result = await reductionTable.getLastestReduction(type, user_id, company_name);
    return result;
});

apiDescriptionGroup.add({
    tip: '修改或添加扣税明细',
    bodyFromTable: 'MOA_TAX_REDUCTION',
    results: [{
        code: 200,
        data: '{}'
    }]
})
router.setAgs(getBody, getUserID)
router.post("/reduction", async (body, userID) => {
    if (!util.isArray(body)) {
        body = [body];
    }
    const hasId = [],
        noID = [];
    body.forEach(b => {
        if (b.ID > 0) {
            hasId.push(b);
        } else {
            noID.push(b);
        }
    })
    return Promise.all([reductionUtil.updateReduction(noID, userID)].concat(hasId.map(h => reductionTable.update(h, userID))));
});


apiDescriptionGroup.add({
    tip: '获得扣税金额设定表',
    bodyFromTable: 'MOA_TAX_REDUCTION',
    results: [{
        code: 200,
        data: '{}'
    }]
})
router.setAgs(1)
router.get("/setting", async () => {
    return settingTable.search();
});

apiDescriptionGroup.add({
    tip: '获得抵税金额明细表',
    bodyFromTable: 'MOA_TAX_REDUCTION',
    results: [{
        code: 200,
        data: '{}'
    }]
})
router.setAgs(getQuery)
router.get("/details", async (query) => {
    return detailTable.search(query);
});

module.exports = router;