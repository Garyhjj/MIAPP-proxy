const koa = require("koa"),
  proxy = require("koa-proxy"),
  convert = require("koa-convert"),
  koaBody = require("koa-body"),
  http = require("http"),
  https = require("https"),
  cors = require("koa-cors"),
  winston = require("winston"),
  enforceHttps = require("koa-sslify"),
  fs = require("fs"),
  views = require("koa-views"),
  ejs = require("ejs"),
  static = require("koa-static"),
  compress = require("koa-compress"),
  staticCache = require("koa-static-cache"),
  path = require("path"),
  moment = require("moment");
const {
  logger
} = require("koa2-winston");

const route = require("./route");
const config = require("./config").base;
const util = require("./util/");
const handleError = util.handlerError;
const {
  prepareReqOption,
  recordRequestDetial
} = require("./middlewares/");

var app = new koa();

// app.use(enforceHttps());
app.use(recordRequestDetial);
app.use(convert(cors()));
app.use(koaBody());
// 中间件 设置gzip
app.use(
  compress({
    threshold: 2048,
    flush: require("zlib").Z_SYNC_FLUSH
  })
);
app.use(
  views(__dirname + "/views", {
    extension: "ejs"
  })
);
app.use(static(__dirname + "/public"));
// 静态文件服务
app.use(
  convert(
    staticCache(path.join(__dirname, "public"), {
      maxAge: 365 * 24 * 60 * 60,
      dynamic: true
    })
  )
);

app.use(prepareReqOption);

if (process.env.NODE_ENV && process.env.NODE_ENV.trim() === "production") {
  // 所有请求日志
  app.use(
    logger({
      transports: [
        new winston.transports.Console({
          json: true,
          colorize: true
        }),
        new winston.transports.File({
          filename: `logs/success/${moment(new Date()).format("YYYYMMDD")}.log`
        })
      ],
      level: "info"
    })
  );
  app.use(handleError);
}

route(app);

app.use(
  convert(
    proxy({
      host: config.proxy
    })
  )
);

const options = {
  key: fs.readFileSync("./ssl/server.key"), //ssl文件路径
  cert: fs.readFileSync("./ssl/server.pem") //ssl文件路径
};

http.createServer(app.callback()).listen(config.httpPort);
https.createServer(options, app.callback()).listen(443);
// http.createServer(app.callback()).listen(3000);