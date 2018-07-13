const Router = require("koa-router"),
    util = require("../../util"),
    isErr = util.isReqError,
    jwtCheck = require("../../middlewares/").jwtCheck,
    db = require("../../lib/oracleDB");

var router = new Router({
    prefix: "/ReportErp"
});

//router.use(jwtCheck);

router.get("/GetStorageAgeAnalysis", async ctx => {
    const query = ctx.query;
    let buCode = query.buCode;
    let result = await db.execute(
        `SELECT '公司' SOURCE_SITE,'年月' YYYYMM,'BU'  BU_CODE,'0-30 days' AMT30,'0~30RATE' RATE30,'30-60 days' AMT60,'31~60RATE' RATE60,'61-90 days'  AMT90,'61~90RATE' RATE90,'91-120 days' AMT120,'91~120RATE' RATE120,
        '>120 days' AMT_MORE,'>120RATE' RATE_MORE, 'TOTAL' AMT_TOTAL from dual  union all
        SELECT * FROM (  SELECT * FROM (SELECT * FROM (    
        SELECT SOURCE_SITE ,YYYYMM ,BU_CODE , TO_CHAR(AMT30),TO_CHAR(RATE30),TO_CHAR(AMT60),TO_CHAR(RATE60),TO_CHAR(AMT90),TO_CHAR(RATE90),TO_CHAR(AMT120),TO_CHAR(RATE120),TO_CHAR((AMT180+AMT360+AMT_MORE)) AMT_MORE,
        TO_CHAR((RATE180+RATE360+RATE_MORE )) RATE_MORE, TO_CHAR(AMT_TOTAL)
        FROM   MINV_SUBINV_YYYYMM_DATA@micerp
        WHERE BU_CODE='${buCode}'
          ORDER BY YYYYMM DESC)
         WHERE ROWNUM<6) ORDER BY YYYYMM )`
    );
    ctx.response.body = result.rows;
});

module.exports = router;