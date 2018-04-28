const requestOption = require("./requestOption");
const fs = require("fs");
const moment = require("moment"),
  winston = require("winston"),
  updateStoreWithLockResolve = require("./updateStoreWithLock")
    .updateStoreWithLockResolve;
const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: `logs/error/${moment(new Date()).format("YYYYMMDD")}.log`
    })
  ],
  level: "error"
});

const isModuleAdmin = function(privilege, type) {
  if (privilege === void 0) return false;
  if (type === void 0) return false;
  if (!(privilege instanceof Array)) return false;
  return !!privilege
    .filter(i => i.ROLE_NAME.indexOf(type.toUpperCase()) > -1)
    .find(l => l.FUNCTION_URL === "CheckProblem");
};

const isSuperUser = function(privilege, type) {
  if (privilege === void 0) return false;
  if (type === void 0) return false;
  if (!(privilege instanceof Array)) return false;
  return !!privilege.find(
    l => l.ROLE_NAME.indexOf(type.toUpperCase() + "_ADMIN") > -1
  );
};
const isArray = ar => {
  return Object.prototype.toString.call(ar) === "[object Array]";
};
const isDate = date => {
  return moment(date).isValid();
};
const isNumber = num => {
  return !Number.isNaN(Number(num));
};
const isReqError = res =>
  (res && typeof res.statusCode === "number") ||
  (typeof res.name === "string" && res.name.indexOf("Error") > -1);

module.exports = {
  isArray,
  requestOption,
  isReqError,
  updateStoreWithLockResolve,
  handlerError: async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (typeof err !== "object") {
        err = {
          name: "undefined",
          message: err
        };
      }
      logger.log("error", err.message, {
        request: JSON.stringify(ctx.request),
        errName: err.name
      });
      const code = err.statusCode || err.status;
      // fs.appendFileSync(
      //   `logs/error/${moment(new Date()).format("YYYYMMDD")}.log`,
      //   `${err.name}: ${err.message} ;code :${code}`
      // );
      ctx.response.status = code || 400;
      ctx.response.body = err.error || err.message;
    }
  },
  replaceQuery: function(url, query) {
    for (let prop in query) {
      url = url.replace(`{${prop}}`, query[prop]);
    }
    url = url.replace(/\{\w+\}/g, "");
    return url;
  },
  isModuleAdmin,
  isSuperUser,
  getRole: (privilege, type) => {
    // 1超级管理员，2普通管理员，3普通使用者
    if (isSuperUser(privilege, type)) {
      return 1;
    } else if (isModuleAdmin(privilege, type)) {
      return 2;
    } else {
      return 3;
    }
  },
  sortUtils: {
    byCharCode: (a, b, isAscend = true) => {
      if (typeof a !== "string" || typeof b !== "string") return 0;
      const res = a.charCodeAt(0) - b.charCodeAt(0);
      return isAscend ? res : -res;
    },
    byDate: (a, b, isAscend = true, format) => {
      const toDateA = moment(a, format);
      const toDateB = moment(b, format);
      if (!toDateA.isValid() || !toDateB.isValid()) return 0;
      const res = toDateA.toDate().getTime() - toDateB.toDate().getTime();
      return isAscend ? res : -res;
    },
    byTime: (a, b, isAscend = true, format = "HH:mm:ss") => {
      const toDateA = moment("2018-01-01T " + a, "YYYY-MM-DDT " + format);
      const toDateB = moment("2018-01-01T " + b, "YYYY-MM-DDT " + format);
      if (!toDateA.isValid() || !toDateB.isValid()) return 0;
      const res = toDateA.toDate().getTime() - toDateB.toDate().getTime();
      return isAscend ? res : -res;
    },
    byNumber: (a, b, isAscend = true) => {
      if (!isNumber(a) || !isNumber(b)) return 0;
      const res = Number(a) - Number(b);
      return isAscend ? res : -res;
    }
  },
  isProduction() {
    return process.env.NODE_ENV && process.env.NODE_ENV.trim() === "production";
  },
  httpErr400(errMes) {
    return {
      statusCode: 400,
      error: errMes
    };
  }
};
