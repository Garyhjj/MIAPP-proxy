const Router = require('koa-router');
const overTime_router = require('./OverTime');
function route(app) {
    app.use(overTime_router.routes()).use(overTime_router.allowedMethods())
}

module.exports = route;