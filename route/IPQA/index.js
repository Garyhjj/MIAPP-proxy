const Router = require("koa-router"),
  request = require("request-promise-native"),
  config = require("./share/config/"),
  util = require("../../util"),
  reqOption = util.requestOption,
  isErr = util.isReqError,
  jwtCheck = require("../../middlewares/").jwtCheck,
  bossTipsCollection = require("./share/utils").bossTipsCollection;
(equipTipsCollection = require("./share/utils").equipTipsCollection),
(bossReq = require("./share/utils/boss-req/index")),
(IPQAReq = require("./share/utils/IPQA-req/"));
baseReq = require("./share/utils/baseReq");
sortUtils = util.sortUtils;

var router = new Router({
  prefix: "/IPQA"
});

router.use(jwtCheck);

router.get("/commentInfo", async ctx => {
  const query = ctx.query;
  res = await bossReq.getCommentInfo(ctx.query, ctx.miOption);
  ctx.response.body = res;
});

router.get("/attendanceInfo", async ctx => {
  const query = ctx.query;
  res = await bossReq.getAttendanceInfo(ctx.query, ctx.miOption);
  ctx.response.body = res;
});

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

router.get("/ownUndoneReports", async ctx => {
  let query = ctx.query;
  let res = await bossReq.getOwnUndoneReport(query, ctx.miOption).toPromise();
  ctx.response.body = res;
});

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

// router.post("/GetHeaderLinesReport", async ctx => {
//   const result = await IPQAReq.GetHeaderLinesReport(
//     ctx.request.body,
//     ctx.miOption
//   );
//   ctx.response.body = result;
// });

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