const Router = require('koa-router');
const overTime_router = require('./OverTime');
const IPQA_route = require('./IPQA/');
function route(app) {
    const addRoute = (route,app) => app.use(route.routes()).use(route.allowedMethods());
    // app.use(overTime_router.routes()).use(overTime_router.allowedMethods());
    addRoute(overTime_router,app);
    addRoute(IPQA_route,app);

}

module.exports = route;