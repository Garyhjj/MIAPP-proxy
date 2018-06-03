const Router = require("koa-router"),
  IPQA_route = require("./IPQA/"),
  user_route = require("./users/"),
  api_route = require("./nodeAPI/"),
  reservation_route = require("./reservation/"),
  util = require("./utils/"),
  project_route = require('./project');

function route(app) {
  const addRoute = (route) =>
    app.use(route.routes()).use(route.allowedMethods());
  // app.use(overTime_router.routes()).use(overTime_router.allowedMethods());
  addRoute(IPQA_route);
  addRoute(user_route);
  addRoute(api_route);
  addRoute(reservation_route);
  addRoute(util);
  addRoute(project_route);
}

module.exports = route;