const requestOption = require("./requestOption");
const fs = require("fs");
const moment = require("moment"),
  winston = require("winston"),
  updateStoreWithLockResolver = require("./updateStoreWithLock")
  .updateStoreWithLockResolver;
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
const crypto = require("crypto"),
  key = require("../constants").jwtKey;

const isModuleAdmin = function (privilege, type) {
  if (privilege === void 0) return false;
  if (type === void 0) return false;
  if (!(privilege instanceof Array)) return false;
  return !!privilege
    .filter(i => i.ROLE_NAME.indexOf(type.toUpperCase()) > -1)
    .find(l => l.FUNCTION_URL === "CheckProblem");
};

const isSuperUser = function (privilege, type) {
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
const isString = string => {
  return typeof string === 'string';
};
const isReqError = res =>
  (res && typeof res.statusCode === "number") ||
  (typeof res.name === "string" && res.name.indexOf("Error") > -1);
const assert = (s, m) => {
  if (!s) {
    throw new Error(m);
  }
};

const hasOwnProperty = Object.prototype.hasOwnProperty;

function hasOwn(
  obj,
  key,
) {
  return hasOwnProperty.call(obj, key);
}

function fakeToken() {
  const expDate = new Date(Date.now() + 1000 * 60 * 30);
  header = ``,
    content = Buffer.from(JSON.stringify({
      Exp: expDate.toISOString(),
      UserID: 26.0,
      CompanyID: "MSL"
    })).toString("base64"),
    sign = crypto
    .createHmac("sha256", header + "." + content)
    .update(key)
    .digest("base64");
  return {
    token: `${header}.${content}.${sign}`,
    exp: expDate.getTime()
  }
}

function promisify(nodeFunction) {
  function promisified(...args) {
    return new Promise((resolve, reject) => {
      function callback(err, ...result) {
        if (err)
          return reject(err);
        if (result.length === 1)
          return resolve(result[0]);
        return resolve(result);
      }
      nodeFunction.call(null, ...args, callback);
    });
  }
  return promisified;
}

function arrayClassifyByOne(target, prop) {
  if (!Array.isArray(target)) return null;
  let out = {};
  target.forEach(t => {
    const val = t[prop] || 'null';
    out[val] = out[val] || [];
    out[val].push(t);
  })
  return out;
}
const wait = (after) => {
  return new Promise((r, j) => {
      setTimeout(() => {
          try {
              r('ok');
          } catch (e) {
              j(e);
          }
      }, after);

  })
}
function promiseFlow(fn) {
  if (typeof fn === 'function') {
      return new Promise((resolve, reject) => {
          promiseFlow.list.push({
              resolve,
              reject,
              fn
          });
      })
  } else {
      return Promise.reject('no fn');
  }
}
promiseFlow.list = [];
promiseFlow.startFlow = async function () {
  const list = this.list;
  if (list.length > 0) {
      const first = list.shift();
      let error;
      const res = await first.fn().catch((err) => {
        error = err;
        first.reject(err);
        return null;
      })
      if(!error) {
        await first.resolve(res);
      }
      promiseFlow.startFlow();
  }
}
const push = Array.prototype.push;
promiseFlow.list.push = function (n) {
  const lg = this.length;
  if (lg === 0) {
      setTimeout(() => {
          promiseFlow.startFlow()
      }, 200);
  }
  return push.call(this, n);
}
module.exports = {
  promiseFlow,
  hasOwn,
  fakeToken,
  isArray,
  isString,
  requestOption,
  isReqError,
  updateStoreWithLockResolver,
  assert,
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
  replaceQuery: function (url, query, opts) {
    for (let prop in query) {
      if (opts && typeof opts.propMap === 'function') {
        prop = opts.propMap.call(null, prop);
      }
      url = url.replace(`{${prop}}`, query[prop]);
    }
    url = url.replace(/\{\w+\}/g, opts && opts.nullVal ? opts.nullVal : '');
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
      a = a + '';
      b = b + '';
      const res = a > b ? 1 : a === b ? 0 : -1;
      return isAscend ? res : -res;
    },
    byDate: (a, b, isAscend = true, format) => {
      const toDateA = moment(a, format);
      const toDateB = moment(b, format);
      const isValida = toDateA.isValid(),
        isValidb = toDateB.isValid();
      let res;
      if (!isValida && !isValidb) {
        return sortUtils.byCharCode(a, b, isAscend);
      } else if (isValida && !isValidb) {
        res = 1;
      } else if (!isValida && isValidb) {
        res = -1;
      } else {
        res = toDateA.toDate().getTime() - toDateB.toDate().getTime();
      }
      return isAscend ? res : -res;
    },
    byTime: (
      a,
      b,
      isAscend = true,
      format = 'HH:mm:ss',
    ) => {
      const toDateA = moment('2018-01-01T ' + a, 'YYYY-MM-DDT ' + format);
      const toDateB = moment('2018-01-01T ' + b, 'YYYY-MM-DDT ' + format);
      const isValida = toDateA.isValid(),
        isValidb = toDateB.isValid();
      let res;
      if (!isValida && !isValidb) {
        return sortUtils.byCharCode(a, b, isAscend);
      } else if (isValida && !isValidb) {
        res = 1;
      } else if (!isValida && isValidb) {
        res = -1;
      } else {
        res = toDateA.toDate().getTime() - toDateB.toDate().getTime();
      }
      return isAscend ? res : -res;
    },
    byNumber: (a, b, isAscend = true) => {
      const isValida = isNumber(a),
        isValidb = isNumber(b);
      let res;
      if (!isValida && !isValidb) {
        return sortUtils.byCharCode(a, b, isAscend);
      } else if (isValida && !isValidb) {
        res = 1;
      } else if (!isValida && isValidb) {
        res = -1;
      } else {
        res = Number(a) - Number(b);
      }
      return isAscend ? res : -res;
    },
  },
  isProduction() {
    return !!(process.env.NODE_ENV && process.env.NODE_ENV.trim() === "production");
  },
  httpErr400(errMes) {
    return {
      statusCode: 400,
      error: errMes
    };
  },
  getUserID: (ctx) => ctx.miUser && ctx.miUser.UserID || -1,
  promisify,
  arrayClassifyByOne
};