const Router = require("koa-router"),
  IPQA_route = require("./IPQA/"),
  user_route = require("./users/"),
  api_route = require("./nodeAPI/"),
  reservation_route = require("./reservation/"),
  util = require("./utils/");
function route(app) {
  const addRoute = (route, app) =>
    app.use(route.routes()).use(route.allowedMethods());
  // app.use(overTime_router.routes()).use(overTime_router.allowedMethods());
  addRoute(IPQA_route, app);
  addRoute(user_route, app);
  addRoute(api_route, app);
  addRoute(reservation_route, app);
  addRoute(util, app);
}

module.exports = route;
