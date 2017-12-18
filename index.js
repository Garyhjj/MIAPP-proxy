const koa = require('koa'),
    proxy = require('koa-proxy'),
    convert = require('koa-convert'),
    koaBody = require('koa-body'),
    cors = require('koa-cors'),
    winston = require('winston');
moment = require('moment');
const {
    logger
} = require('koa2-winston');

const route = require('./route');
const config = require('./config').base;
const handleError = require('./util/').handlerError;

var app = new koa();
app.use(convert(cors()));
app.use(koaBody());

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

route(app);

app.use(convert(proxy({
    host: config.proxy
})));

app.listen(3000);
