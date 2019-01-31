const Router = require("koa-router"),
    jwtCheck = require("../../middlewares/").jwtCheck,
    {
        ApiDescriptionGroup
    } = require('../../util/apiDescription'),
    db = require("../../lib/oracleDB"),
    tableUtil = require('../../tables/share/util'),
    toStoreString = tableUtil.toStoreString;

var router = new Router({
    prefix: "/exams"
});

const apiDescriptionGroup = new ApiDescriptionGroup(router);

router.use(jwtCheck);


apiDescriptionGroup.add({
    tip: '获得考试结果',
    params: [{
        name: 'id',
        type: '试卷id',
        example: '2'
    }, {
        name: 'date',
        type: '考试日期',
        example: '2018-08-22'
    }, {
        name: 'empno',
        type: '工号',
        example: 'FX823'
    }, ],
    results: [{
        code: 200,
        data: ``
    }]
})
router.get('/results', async ctx => {
    let {
        id,
        date,
        empno
    } = ctx.query;
    id = id || toStoreString('');
    date = tableUtil.toStoreDate(date, 'yyyy/mm/dd', 'YYYY-MM-DD');
    empno = toStoreString(empno);
    let err, data;
    data = await db.execute(`SELECT C.EMPNO,C.NICK_NAME,TO_CHAR(B.CREATION_DATE,'YYYY-MM-DD') IDATE,D.DEPTNO,E.SHORT_NAME,TO_CHAR(B.CREATION_DATE,'HH24:MI:SS') TIME,A.TITLE,B.RESULT,GET_EXAM_WRONG_NUMBER(A.ID,B.ID) WRONG_QUESTION,
    CASE WHEN  B.RESULT>=A.PASS_SCORE THEN '否' ELSE '是' END  RESIT,E.ASSISTANT
    FROM MOA_EXAMS A,MOA_EXAM_RESULT B,MOA_GL_USERS C,GUID_EMPLOYEE D,GUID_PS_DEPARTMENT E
    WHERE  A.ID=B.EXAM_ID     
    AND B.USER_ID=C.ID
    AND C.COMPANY_ID=D.COMPANY_ID
    AND C.EMPNO=D.EMPNO
    AND D.COMPANY_ID=E.SITE
    AND D.DEPTNO=E.DEPTNO
    AND (D.EMPNO = ${empno} or ${empno} is NULL)
    AND (${id} IS NULL or A.ID = ${id})
    AND (TRUNC(B.CREATION_DATE)=${date} or ${date} is null)
    ORDER BY D.DEPTNO,EMPNO,IDATE,TIME`).then(r => r.rows).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

router.get('/contacts', async ctx => {
    let {
        empno,
        date
    } = ctx.query;
    empno = empno || '';
    date = date || '';
    let err, data;
    if (!empno && !date) {
        data = [];
    } else {
        data = await db.execute(`select EMPNO,  NICK_NAME, MOBILE, TELEPHONE 
        from moa_gl_users a where 
        ('${date}' is null or exists (select 1 from moa_exam_result b  where b.USER_ID = a.ID and to_char(b.creation_date,'yyyy-mm-dd') = '${date}'))
        and 
        ('${empno}' is null or a.empno = '${empno}')
        `).then((r) => r.rows).catch((e) => {
            err = e.message ? e.message : e;
        });
    }

    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    };

})

module.exports = router;