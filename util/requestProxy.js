const request = require('request-promise-native');
var config = require('../config/base');


function RequestProxy(proxy){
    this.proxy = proxy;
}

RequestProxy.prototype.initOptions = function(ctx) {
    return  {
        headers: {
            'User-Agent': 'request',
            'Content-Type': 'application/json; charset=utf-8',
            'access_token': ctx.request.headers.access_token
          }
    }
}

RequestProxy.prototype.bindMethod = function(method,url,ctx,opt) {
    if(!url) return request[method]();
    let myOpt;
    if(ctx !== void 0) myOpt = this.initOptions(ctx);
    if(opt !== void 0) {
        myOpt = {};
        Object.assign(myOpt,opt);
    }
    url = this.proxy + url
    if(myOpt) {
        return request[method](url,myOpt)
    }else {
        return request[method](url);
    }
}
RequestProxy.prototype.get = function(url,ctx,opt) {
    return this.bindMethod('get',url,ctx,opt);
}

RequestProxy.prototype.post = function(url,ctx,opt) {
    return this.bindMethod('post',url,ctx,opt);
}
RequestProxy.prototype.delete = function(url,ctx,opt) {
    return this.bindMethod('delete',url,ctx,opt);
}
RequestProxy.prototype.put = function(url,ctx,opt) {
    return this.bindMethod('put',url,ctx,opt);
}

let requestProxy = new RequestProxy(config.proxy);

module.exports = requestProxy;