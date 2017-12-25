const Router = require('koa-router'),
    request = require('request-promise-native'),
    config = require('../../config/base'),
    util = require('../../util'),
    reqOption = util.requestOption,
    isErr = util.isReqError,
    des = require('../../config/api/description/')

var router = new Router({
    prefix: '/nodeAPI'
});


router.get('/', async(ctx) => {
    await ctx.render('home.ejs',{home:true});
})

router.get('/lists', async(ctx) => {
    if(des.info.length === 0) ctx.redirect('back');
    let prefix = ctx.query.prefix || 'users';
    let route = des.info.find(i => i.info.prefix === prefix);
    route = route?route:des.info[0];
    await ctx.render('api-list.ejs',{home:false,des:des,route:route});
})

router.get('/details', async(ctx) => {
    if(des.info.length === 0) ctx.redirect('back');
    let prefix = ctx.query.prefix;
    let route = ctx.query.route;
    let method = ctx.query.method;
    if(!prefix || !route) ctx.redirect('back');
    let router = des.info.find(i => i.info.prefix === prefix);
    if(!router) ctx.redirect('back');
    let apis =  router.info.routes.find((r) =>r.info.route === route);
    if(!apis) ctx.redirect('back');
    let api = apis.info.des.find((a) => a.method === method);
    if(!api) ctx.redirect('back');
    await ctx.render('api-detail.ejs',{home:false,des:des,route:router,api:api,apis:apis});
})

module.exports = router;