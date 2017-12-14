var koa = require('koa');
var proxy = require('koa-proxy');
const convert = require('koa-convert');
const Router = require('koa-router');
var cors = require('koa-cors');
var requestProxy = require('./util/requestProxy');

var request = require('request-promise-native');

var config = require('./config/base');
var app = new koa();
app.use(convert(cors()));
var router = new Router({
    prefix: '/a'
});

router.get('/', async(ctx) => {
    console.log(ctx.request.url);
    console.log(requestProxy[ctx.request.method.toLowerCase()])
    let a = await requestProxy.get('IPQA/GetProblemTrack?nameID=4&dateFM=2017-11-14&dateTO=2017-12-14&company_name=MSL&type=boss').catch(err => console.log(err))
    // let a = await request.get(config.proxy+'IPQA/GetProblemTrack?nameID=4&dateFM=2017-11-14&dateTO=2017-12-14&company_name=MSL&type=boss',{
    //     headers: {
    //         'User-Agent': 'request',
    //         'access_token': "eyJUeXBlIjoiSldUIiwiQWxnIjoiSFMyNTYifQ==.eyJFeHAiOiIyMDE3LTEyLTE0VDA4OjU4OjU3LjczNTk5NTlaIiwiVXNlcklEIjoyNi4wLCJDb21wYW55SUQiOiJNU0wifQ==.rHhghJq+HIHoU4Af0vFRzLG2tHK1i4odTrntjiJmyJ8="
    //       }
    // }).catch(err =>console.log(err));
    console.log(a);
    ctx.response.body = a;
})

// let a = async () => await request(config.proxy+'IPQA/GetProblemTrack?nameID=4&dateFM=2017-11-14&dateTO=2017-12-14&company_name=MSL&type=boss',{
//     headers: {
//         'User-Agent': 'request',
//         'access_token': "eyJUeXBlIjoiSldUIiwiQWxnIjoiSFMyNTYifQ==.eyJFeHAiOiIyMDE3LTEyLTE0VDA3OjQyOjM2LjQyNTU4NjVaIiwiVXNlcklEIjoyNi4wLCJDb21wYW55SUQiOiJNU0wifQ==.OYcgjKUYZqG0+cj4s+bFQ+FUHnFoGcqTHgRMhjiks+Q="
//       }
// }).catch(err =>console.log(err.error));
// console.log(a())
// app.use((ctx,next)=>{
//     console.log(ctx.request.headers.access_token);
//     next();
// })
app.use(router.routes())
    .use(router.allowedMethods());
// app.use(async(ctx) => {
//     let method = ctx.request.method.toLowerCase()
//     let a = await requestProxy[method](ctx.request.url,ctx).catch(err => console.log(err.response));
//     ctx.respond.body = a;
// })
app.use((ctx,next) => {
    next();
})
// app.use(convert(proxy({
//     host: config.proxy
// })));
app.listen(3000);