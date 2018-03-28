const formatProxy = 'http://miapphost01.mic.com.cn/',
    testProxy = 'http://webapi.mic.com.cn/',
    isProd = require('../util/').isProduction;
proxy = isProd() ? formatProxy : testProxy
module.exports = {
    // proxy: 'http://miapphost01.mic.com.cn/'
    proxy: proxy,
    httpPort: isProd() ? 80 : 8082
}