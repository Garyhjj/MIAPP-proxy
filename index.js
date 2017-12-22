const koa = require('koa'),
    proxy = require('koa-proxy'),
    convert = require('koa-convert'),
    koaBody = require('koa-body'),
    http = require('http'),
    https = require('https'),
    cors = require('koa-cors'),
    winston = require('winston'),
    enforceHttps = require('koa-sslify'),
    fs = require('fs'),
    views = require('koa-views'),
    ejs = require('ejs'),
    moment = require('moment');
const {
    logger
} = require('koa2-winston');

const route = require('./route');
const config = require('./config').base;
const handleError = require('./util/').handlerError;
const prepareReqOption = require('./middlewares/').prepareReqOption;

var app = new koa();

// app.use(enforceHttps());

app.use(convert(cors()));
app.use(koaBody());
app.use(views(__dirname + '/views', {
    extension: 'ejs'
}));
app.use(prepareReqOption);
// app.use((ctx) => ctx.render('1.ejs'));
if (process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'production') {
    // 正常请求日志
    app.use(logger({
        transports: [
            new(winston.transports.Console)({
                json: true,
                colorize: true
            }),
            new winston.transports.File({
                filename: `logs/success/${moment(new Date()).format('YYYYMMDD')}.log`
            })
        ]
    }))

    // 错误请求日志
    app.use(logger({
        transports: [
            new winston.transports.Console({
                json: true,
                colorize: true
            }),
            new winston.transports.File({
                filename: `logs/error/${moment(new Date()).format('YYYYMMDD')}.log`
            })
        ]
    }))

    app.use(handleError);
}


route(app);

app.use(convert(proxy({
    host: config.proxy
})));

const options = {
    key: fs.readFileSync('./ssl/server.key'), //ssl文件路径
    cert: fs.readFileSync('./ssl/server.pem') //ssl文件路径
};

http.createServer(app.callback()).listen(80);
https.createServer(options, app.callback()).listen(443);