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
    } = require('../../util/apiDescription');

    const db = require('../../lib/oracleDB'),
    salesTable = require('../../tables/wClothes/moa_w_clothes_sales'),
    {promiseFlow} = util;

var router = new EasyRouter({
    prefix: "/activity"
});

router.use(jwtCheck);

const apiDescriptionGroup = new ApiDescriptionGroup(router);

apiDescriptionGroup.add({
    tip: '获得扣税明细',
    results: [{
        code: 200,
        fromTable: 'MOA_TAX_REDUCTION'
    }]
})

const types = {'A': ['F','S'],
'B': ['F','M'],
'C': ['M','S'],
'D': ['M','M'],
'E': ['M','L'],
'F': ['M','XL'],
'G': ['M','XXL'],
}
async function getStore(sex, size) {
    const [total, sales] = await Promise.all([db.search(`select AMOUNT from MOA_W_CLOTHES_STORE where C_TYPE='${sex}' and C_SIZE = '${size}'`).then((res) => res[0].AMOUNT),
    db.search(`select count(1) count from MOA_W_CLOTHES_SALES where C_TYPE='${sex}' and C_SIZE = '${size}'`).then(res => res[0].COUNT)]);
    return Math.max(0,total - sales);
}
router.setAgs(getQuery);
router.get("/wClothes/store", async (query) => {
    const {type} = query;
    if(!type || !types[type]) {
        return 0;
    }
    const [sex,size] = types[type];
    return  getStore(sex,size);
});
router.setAgs(getBody);
router.post("/wClothes/sales", async (body) => {
    if (!util.isArray(body)) {
        body = [body];
    }
    return Promise.all(body.map(b => {
        const sex = b.C_TYPE,
        size = b.C_SIZE;
        return promiseFlow(() => getStore(sex,size).then((s) => {
            if(s > 0) {
                return salesTable.update(b);
            }else {
                return Promise.reject(`${sex === 'F'?'女': '男'} ${size} 库存不足`)
            }
        }))
    }));
});

router.setAgs(getQuery);
router.get("/wClothes/sales", async (query) => {
    const {empno} = query;
    const tableName = salesTable.tableName;
    if(empno) {
        return db.search(`select c_type,c_size,count(1) amount, empno 
        from ${tableName} where empno = '${empno}' 
        group by c_type,c_size,empno`)
    }else {
        return db.search(`select c_type,c_size,count(1) amount, empno 
        from ${tableName} 
        group by c_type,c_size,empno`);
    }
});

module.exports = router;