const Router = require("koa-router"),
  request = require("request-promise-native"),
  config = require("../../config/base"),
  util = require("../../util"),
  db = require("../../lib/oracleDB"),
  moment = require("moment"),
  assert = util.assert,
  exec = require("child_process").exec,
  execPromise = command =>
  new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout, stderr);
      }
    });
  });
var router = new Router({
  prefix: "/utils"
});
if (!util.isProduction()) {
  const safeCommands = [
    "npm run update",
    "npm run serve",
    "npm run update:dev",
    "npm run serve:dev",
    "npm run build",
    "pm2 list",
    "git checkout -- .",
    `npm run kill`
  ];
  router.post("/commands", async ctx => {
    const body = ctx.request.body;
    const user = body.user;
    const password = body.password;
    if (user === "mitacoa" && password === "MSL2018!") {
      if (typeof body.command === "string" && body.command) {
        const command = body.command;
        const testCommand = command => {
          // const ls = command.split("&&");
          // let valid = true;
          // for (let i = 0, lg = ls.length; i < lg; i++) {
          //   const l = ls[i].trim();
          //   const first = l.split(" ")[0];
          //   if (["npm", "git", "pm2"].indexOf(first) < 0) {
          //     valid = false;
          //     break;
          //   }
          // }
          // return valid;
          return safeCommands.indexOf(command) > -1;
        };
        if (testCommand(command)) {
          const res = await execPromise(command)
            .then((stdout, stderr) => stdout)
            .catch(err => err.stack);
          ctx.response.body = res;
        } else {
          ctx.response.status = 400;
          ctx.response.body = "无效命令";
        }
      } else {
        ctx.response.status = 400;
        ctx.response.body = "无效命令";
      }
    } else {
      ctx.response.status = 403;
      ctx.response.body = "未授权";
    }
  });
}

router.get("/logs", async ctx => {
  const query = ctx.query;
  let fromDate = moment(query.fromDate || "2017/12/31");
  if (!fromDate.isValid()) {
    fromDate = moment("2017/12/31");
  }
  let endDate = moment(query.endDate);
  if (!endDate.isValid()) {
    endDate = moment();
  }
  let result = await db.execute(
    `select * from MOA_LOG_TABLE where CREATION_DATE >= to_date('${fromDate.format(
      "YYYYMMDD"
    )}','yyyymmdd HH24:Mi:SS') and CREATION_DATE <= to_date('${endDate.format(
      "YYYYMMDD"
    )}','yyyymmdd HH24:Mi:SS')`
  );
  ctx.response.body = result.rows;
});

router.post("/logs", async ctx => {
  const body = ctx.request.body;
  let log, error;
  try {
    log = new Log(body);
  } catch (e) {
    error = e.message;
  }
  if (error) {
    ctx.response.status = 400;
    ctx.response.body = error;
  } else {
    let result = await db.execute(
      `insert into moa_log_table values ('${log.STATUS_CODE}','${log.BODY}','${
        log.MOBILE_FLAG
      }','${log.EQUIP_NAME}',to_date('${
        log.CREATION_DATE
      }','yyyymmdd HH24:Mi:SS'),${log.CREATED_BY})`
    );
    ctx.response.body = {};
  }
});

module.exports = router;

class Log {
  constructor(body) {
    assert(typeof body === "object" && body, "非有效数据, 无法插入");
    assert(typeof body.STATUS_CODE === "number", "STATUS_CODE 必须为数字类型");
    assert(
      typeof body.BODY === "string" ||
      (typeof body.BODY === "object" && body.BODY),
      "BODY 必须为对象或者字符串"
    );
    assert(
      body.MOBILE_FLAG === "N" || body.MOBILE_FLAG === "Y",
      "MOBILE_FLAG 只能为Y或者N"
    );
    assert(
      typeof body.EQUIP_NAME === "string" && body.EQUIP_NAME,
      "EQUIP_NAME 必须为字符串类型"
    );
    assert(typeof body.CREATED_BY === "number", "CREATED_BY 必须为数字类型");
    this.STATUS_CODE = body.STATUS_CODE;
    this.BODY =
      typeof body.BODY === "object" ?
      JSON.stringify(body.BODY) :
      body.BODY;
    this.BODY = this.BODY.replace(/\;/g, "；").replace(/\'/g, "’");
    this.MOBILE_FLAG = body.MOBILE_FLAG;
    this.EQUIP_NAME = body.EQUIP_NAME.replace(/\;/g, "；");
    this.CREATED_BY = body.CREATED_BY;
    this.CREATION_DATE = moment().format("YYYYMMDD HH:mm:ss");
  }
}