const Router = require('koa-router'),
    request = require('request-promise-native'),
    config = require('../../config/base'),
    util = require('../../util'),
    reqOption = util.requestOption,
    isErr = util.isReqError,
    requestMonitor = util.requestMonitor,
    des = require('../../config/api/description/'),
    moment = require('moment');

var router = new Router({
    prefix: '/nodeAPI'
});


router.get('/', async (ctx) => {
    await ctx.render('home.ejs', {
        routeName: 'home'
    });
})

router.get('/lists', async (ctx) => {
    if (des.info.length === 0) ctx.redirect('back');
    let prefix = ctx.query.prefix || 'users';
    let route = des.info.find(i => i.info.prefix === prefix);
    route = route ? route : des.info[0];
    await ctx.render('api-list.ejs', {
        routeName: 'des',
        des: des,
        route: route
    });
})

router.get('/details', async (ctx) => {
    if (des.info.length === 0) ctx.redirect('back');
    let prefix = ctx.query.prefix;
    let route = ctx.query.route;
    let method = ctx.query.method;
    if (!prefix || !route) ctx.redirect('back');
    let router = des.info.find(i => i.info.prefix === prefix);
    if (!router) ctx.redirect('back');
    let apis = router.info.routes.find((r) => r.info.route === route);
    if (!apis) ctx.redirect('back');
    let api = apis.info.des.find((a) => a.method === method);
    if (!api) ctx.redirect('back');
    await ctx.render('api-detail.ejs', {
        routeName: 'des',
        des: des,
        route: router,
        api: api,
        apis: apis
    });
})

router.get('/monitors', async ctx => {
    const format = 'YYYYMMDD';
    const date = ctx.query.date || moment().format(format);
    let statistics = requestMonitor.getStatisticsByAPI(date);
    statistics.sort((a, b) => b.averageTime - a.averageTime);
    const userList = requestMonitor.getUserList(date);
    const dateMoment = moment(date,format);
    const yesterday = dateMoment.clone().subtract(1,'days').format(format);
    const tomorrow = dateMoment.clone().add(1,'days').format(format);
    const statisticsByTime = requestMonitor.getStatisticsByTime(date);
    const isNow = moment().format(format) === date;
    const countByTime = (() => {
        let l = [];
        for(let i=0;i<24;i++) {
            const h = i<10? '0'+i: i+ '';
            const data = statisticsByTime.find(s => s.hour === h);
            l.push(data? data.count: 0);
        }
        return l;
    })()
    await ctx.render('api-monitor.ejs', {
        routeName: 'monitors',
        statistics,
        yesterday,
        tomorrow,
        date,
        userListLength: userList.length,
        statisticsByTime: JSON.stringify(countByTime),
        isNow
    });
})

module.exports = router;