const formatProxy = 'http://miwebapiintra.mic.com.cn/', // "http://miapphost01.mic.com.cn/",
  testProxy = "http://webapi.mic.com.cn/",
  isProd = require("../util/").isProduction,
  proxy = isProd() ? formatProxy : testProxy;
module.exports = {
  // proxy: 'http://miapphost01.mic.com.cn/'
  proxy: proxy,
  httpPort: isProd() ? 8088 : 8082,
  productionDB: {
    user: "mioa",
    password: "msloa",
    connectString: `10.86.0.139:1521/mioa`
  },
  devDB: {
    user: "mioa",
    password: "msloa",
    connectString: `10.86.3.41:1531/mioa`
  },
};