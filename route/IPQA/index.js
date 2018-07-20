const Router = require("koa-router"),
  config = require("./share/config/"),
  util = require("../../util"),
  isErr = util.isReqError,
  jwtCheck = require("../../middlewares/").jwtCheck,
  bossTipsCollection = require("./share/utils").bossTipsCollection,
  equipTipsCollection = require("./share/utils").equipTipsCollection,
  bossReq = require("./share/utils/boss-req/index"),
  IPQAReq = require("./share/utils/IPQA-req/"),
  baseReq = require("./share/utils/baseReq"),
  sortUtils = util.sortUtils,
  {
    ApiDescriptionGroup
  } = require('../../util/apiDescription');

var router = new Router({
  prefix: "/IPQA"
});

const apiDescriptionGroup = new ApiDescriptionGroup(router);

router.use(jwtCheck);

apiDescriptionGroup.add({
  tip: '獲得巡檢報告的評分信息',
  params: [{
      name: 'nameID',
      type: 'number类型,巡檢種類',
      example: 3,
    },
    {
      name: 'dateFM',
      type: 'string类型,YYYY-MM-DD',
      example: `2018-01-01`,
    },
    {
      name: 'dateTO',
      type: 'string类型,YYYY-MM-DD',
      example: `2018-01-29`,
    },
    {
      name: 'type',
      type: 'number类型: 0代表獲得未評分報告，1已評分，其它獲得全部',
      example: 1,
    }
  ],
  results: [{
    code: 200,
    data: `
{
ACTUAL_HOURS: number
ACTUAL_TO_TIME: string
ACUTAL_FROM_TIME: string
ADDITIONAL_SCORE: number
ALL_DONE: string
HEADER_ID: number
LINE_NUM: number
NAME: string
SCHEDULE_DATE: string
SCHEDULE_HEADER_ID: number
SCORE: number
}[]`
  }]
})
router.get("/commentInfo", async ctx => {
  const query = ctx.query;
  res = await bossReq.getCommentInfo(ctx.query, ctx.miOption);
  ctx.response.body = res;
});


apiDescriptionGroup.add({
  tip: '獲得巡檢人員的出勤信息',
  params: [{
      name: 'nameID',
      type: 'number类型,巡檢種類',
      example: 3,
    },
    {
      name: 'dateFM',
      type: 'string类型,YYYY-MM-DD',
      example: `2018-01-01`,
    },
    {
      name: 'dateTO',
      type: 'string类型,YYYY-MM-DD',
      example: `2018-01-29`,
    },
    {
      name: 'type',
      type: 'number类型: 1未刷卡，2未產生補休，3已產生補休,其它全部',
      example: 1,
    }
  ],
  results: [{
    code: 200,
    data: `
{
ACTUAL_HOURS: number
ACTUAL_TO_TIME: string
ACUTAL_FROM_TIME: string
ADDITIONAL_SCORE: number
ALL_DONE: string
HEADER_ID: number
LINE_NUM: number
NAME: string
SCHEDULE_DATE: string
SCHEDULE_HEADER_ID: number
SCORE: number
}[]`
  }]
})
router.get("/attendanceInfo", async ctx => {
  const query = ctx.query;
  res = await bossReq.getAttendanceInfo(ctx.query, ctx.miOption);
  ctx.response.body = res;
});


apiDescriptionGroup.add({
  tip: '獲得巡檢人員的出勤信息',
  params: [{
    name: 'header_id',
    type: 'number',
    example: 1
  }],
  results: [{
    code: 200,
    fromTable: `MRI_REPORT_LINES_ALL`,
    dataIsArray: true
  }]
})
router.get("/reportLines", async ctx => {
  const query = ctx.query;
  res = await baseReq.getLinesById(ctx.query, ctx.miOption);
  let lines = [];
  if (res && res.Lines) {
    lines = res.Lines.sort((a, b) =>
      sortUtils.byTime(a.INSPECT_TIME, b.INSPECT_TIME)
    );
  }
  ctx.response.body = lines;
});

apiDescriptionGroup.add({
  tip: '獲得問題追蹤列表數據',
  params: [{
      name: 'nameID',
      type: 'number',
      example: 3
    },
    {
      name: 'company_name',
      type: 'string类型: MSL',
      example: 'MSL'
    },
    {
      name: 'type',
      type: '巡检类别: boss、equip',
      example: 'boss'
    },
    {
      name: 'dateFM',
      type: '日期: YYYY-MM-DD',
      example: '2018-01-01'
    },
    {
      name: 'dateTO',
      type: '日期: YYYY-MM-DD',
      example: '2018-03-01'
    },
    {
      name: 'status',
      type: 'string: New | Waiting | Done | Highlight',
      example: 'New'
    }
  ],
  results: [{
    code: 200,
    fromTable: `MRI_REPORT_LINES_ALL`,
    dataIsArray: true
  }]
})
router.get("/tracProblems", async ctx => {
  const query = ctx.query;
  const status = query.status;
  res = await bossReq.getTracProblems(ctx.query, ctx.miOption);
  res =
    (res &&
      res.filter(c => {
        if (c.PROBLEM_FLAG === "Y") {
          if (status) {
            if (c.PROBLEM_STATUS == status) return true;
          } else {
            return true;
          }
        } else {
          return false;
        }
      })) || [];
  ctx.response.body = res;
});


apiDescriptionGroup.add({
  tip: '获得对于管理员的提醒数',
  params: [{
      name: 'role',
      type: 'number类型,1超级管理员,2普通管理员,3普通使用者',
      example: 2
    },
    {
      name: 'type',
      type: '巡检类别: boss、equip',
      example: 'boss'
    },
    {
      name: 'company_name',
      type: 'string类型: MSL',
      example: 'MSL'
    }
  ],
  results: [{
    code: 200,
    data: `非负整数`
  }]
})
router.get("/adminTotalTips", async ctx => {
  let role = +ctx.query.role;
  role = isNaN(role) ? 0 : +role;
  let type = ctx.query.type;
  let res = 0;
  let opts = {
    role,
    company_name: ctx.query.company_name
  };
  if (type === config.boss) {
    res = await bossTipsCollection.getAdminTotalTips(ctx, opts);
  } else if (type === config.equip) {
    res = await equipTipsCollection.getAdminTotalTips(ctx, opts);
  }
  ctx.response.body = res.TIPS;
});

apiDescriptionGroup.add({
  tip: '根据类别获得需要处理的报告',
  params: [{
      name: 'empno',
      type: 'string类型: FX823',
      example: 'FX823'
    },
    {
      name: 'type',
      type: '巡检类别: boss、equip',
      example: 'boss'
    },
    {
      name: 'company_name',
      type: 'string类型: MSL',
      example: 'MSL'
    }
  ],
  results: [{
    code: 200,
    fromTable: `MRI_REPORT_LINES_ALL`,
    dataIsArray: true
  }]
})
router.get("/ownUndoneReports", async ctx => {
  let query = ctx.query;
  let res = await bossReq.getOwnUndoneReport(query, ctx.miOption).toPromise();
  ctx.response.body = res;
});

apiDescriptionGroup.add({
  tip: '根据角色获得IPQA巡检中需要处理的报告',
  params: [{
      name: 'empno',
      type: 'string类型: FX823',
      example: 'FX823'
    },
    {
      name: 'type',
      type: '巡检类别: boss、equip',
      example: 'boss'
    },
    {
      name: 'company_name',
      type: 'string类型: MSL',
      example: 'MSL'
    }
  ],
  results: [{
    code: 200,
    fromTable: `MRI_REPORT_LINES_ALL`,
    dataIsArray: true
  }]
})
router.get("/excIPQAReports", async ctx => {
  let query = ctx.query;
  let role = +query.role;
  let res;
  query.type = config.IPQA;
  if (role === 1) {
    res = await IPQAReq.getAdminExcReports(query, ctx.miOption).toPromise();
  } else {
    res = await IPQAReq.getNormalExcReports(query, ctx.miOption).toPromise();
  }
  ctx.response.body = res;
});


apiDescriptionGroup.add({
  tip: '上传IPQA巡检报告',
  bodyFromTable: 'MRI_REPORT_LINES_ALL',
  results: [{
    code: 200,
    data: 'number'
  }]
})
router.post("/UploadReport", async ctx => {
  let result;
  const body = ctx.request.body;
  if (body.Header.TYPE === "IPQA") {
    //如果header等于0，则重新验证是否已经存在当前的巡检记录
    if (body.Header && body.Lines.length > 0 && body.Header.HEADER_ID === 0) {
      let obj = {
        COMPANY_NAME: body.Header.COMPANY_NAME,
        DUTY_KIND: body.Header.DUTY_KIND,
        EMPNO: body.Header.INSPECTOR,
        INSPECT_DATE: body.Header.INSPECT_DATE,
        LOCATION: body.Lines[0].LOCATION,
        TYPE: "IPQA"
      };
      let headerId = await IPQAReq.GetHeaderLinesReport(
        //ctx.request.body,
        obj,
        ctx.miOption
      );
      // 如果检查到header不等于0，以这个headerid为准
      if (headerId > 0) {
        body.Header.HEADER_ID = headerId;

        let existedData = await IPQAReq.getReportData(headerId, ctx.miOption);

        for (let i = 0; i < body.Lines.length; i++) {
          // body.Lines[i].HEADER_ID = headerId;
          let line = existedData.Lines.find(
            data => data.CHECK_ID === body.Lines[i].CHECK_ID
          );
          if (line) {
            body.Lines[i].HEADER_ID = headerId;
            body.Lines[i].LINE_ID = line.LINE_ID;
            if (
              body.Lines[i].CHECK_RESULT === "NORMAL" ||
              body.Lines[i].CHECK_RESULT === "N/A"
            ) {
              body.Lines[i].PROBLEM_DESC = "";
              body.Lines[i].PROBLEM_FLAG = "N";
              body.Lines[i].NUM = "";
            }
          }
        }
        result = await IPQAReq.UploadReport(body, ctx.miOption);
      } else {
        result = await IPQAReq.UploadReport(ctx.request.body, ctx.miOption);
      }
    } else {
      result = await IPQAReq.UploadReport(ctx.request.body, ctx.miOption);
    }
  } else {
    result = await IPQAReq.UploadReport(ctx.request.body, ctx.miOption);
  }
  ctx.response.body = result;
});

apiDescriptionGroup.add({
  tip: '上传需要巡检的设备的信息',
  bodyFromTable: 'MRI_MACHINE_HEADERS_ALL',
  bodyCanArray: true,
  results: [{
    code: 200,
    data: 'number or number[]'
  }]
})
router.post("/UploadMachineHdr", async ctx => {
  const body = ctx.request.body;
  let res;
  if (Array.isArray(body)) {
    res = await Promise.all(body.map(q => baseReq.uploadMachineHdr(q, ctx.miOption))).catch(err => err);
  } else {
    res = await baseReq.uploadMachineHdr(body, ctx.miOption).catch(err => err);
  }
  if (res.statusCode > 0) {
    ctx.response.status = res.statusCode;
    ctx.response.body = res.error;
  } else if (isErr(res)) {
    ctx.response.status = 400;
    ctx.response.body = res.message;
  } else {
    ctx.response.body = res;
  }
});

module.exports = router;