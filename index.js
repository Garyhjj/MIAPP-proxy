var koa = require('koa');
var proxy = require('koa-proxy');
const convert = require('koa-convert');
const Router = require('koa-router');
const koaBody = require('koa-body');
var cors = require('koa-cors');
var request = require('request-promise-native');
var reqO =require('./util/requestOption');
var config = require('./config/base');
var route = require('./route');

var app = new koa();
app.use(convert(cors()));
app.use(koaBody());

route(app);
// var router = new Router({
//     prefix: '/OverTime'
// });


// router.get('/GetOverTimeTotalHours', async(ctx) => {
//     console.log(ctx.request.url);
//     let a = await request.get(config.proxy+ctx.request.url,reqO(ctx)).catch(err =>console.log(err));
//     ctx.response.body = a;
// })

// let a = async () => await request(config.proxy+'IPQA/GetProblemTrack?nameID=4&dateFM=2017-11-14&dateTO=2017-12-14&company_name=MSL&type=boss',{
//     headers: {
//         'User-Agent': 'request',
//         'access_token': "eyJUeXBlIjoiSldUIiwiQWxnIjoiSFMyNTYifQ==.eyJFeHAiOiIyMDE3LTEyLTE0VDA3OjQyOjM2LjQyNTU4NjVaIiwiVXNlcklEIjoyNi4wLCJDb21wYW55SUQiOiJNU0wifQ==.OYcgjKUYZqG0+cj4s+bFQ+FUHnFoGcqTHgRMhjiks+Q="
//       }
// }).catch(err =>console.log(err.error));
// console.log(a())

// app.use(router.routes())
//     .use(router.allowedMethods());
// app.use(async(ctx) => {
//     let method = ctx.request.method.toLowerCase()
//     let a = await request[method](ctx.request.url,ctx.request.options,ctx.request.body).catch(err => console.log(err.response));
//     console.log(a);
//     ctx.response.body = a;
// })
const logger = (ctx, next) => {
    console.log(`${Date.now()} ${ctx.request.method} ${ctx.request.url}`);
    return next();
  }
app.use(logger);
app.use(convert(proxy({
    host: config.proxy
})));

app.listen(3000);