const Router = require("koa-router");

const myDefault = {
    okStatusCode: 200,
    badStatusCode: 400
}
class EasyRouter extends Router {
    constructor(...arg) {
        super(...arg);
        this._nextRouteAgs = null;
        this._nextRouteStatus = myDefault.okStatusCode;
        const that = this;
        const way = ['get', 'delete', 'post', 'put'];
        way.forEach(w => {
            const fn = this[w].bind(this);
            this[w] = function () {
                const argList = Array.from(arguments);
                const userFn = argList[1];
                const routeAgs = this._nextRouteAgs;
                this._nextRouteAgs = null;
                const routeStatus = this._nextRouteStatus;
                this._nextRouteStatus = myDefault.okStatusCode;
                const exceptionFilter = this._nextExceptionFilter;
                this._nextExceptionFilter = null;
                if (typeof userFn === 'function') {
                    const myFn = async function () {
                        const ctx = arguments[0];
                        let argsErr;
                        const args = await that._parseAgs(ctx, routeAgs).catch((e) => {
                            argsErr = e.message ? e.message : e;
                        });
                        if (argsErr) {
                            ctx.response.status = myDefault.badStatusCode;
                            ctx.response.body = argsErr;
                            return;
                        }
                        const promisefy = new Promise((resolve, reject) => {
                            const res = userFn(...args);
                            resolve(res);
                        })
                        const data = await promisefy.catch((e) => {
                            return {
                                isErr: true,
                                err: e.message ? e.message : e
                            }
                        });
                        if (data && data.isErr) {
                            if (exceptionFilter) {
                                let filerErr;
                                await new Promise((r) => {
                                    r(exceptionFilter(ctx))
                                }).catch((e) => filerErr = e.message ? e.message : e);
                                if (filerErr) {
                                    ctx.response.status = myDefault.badStatusCode;;
                                    ctx.response.body = filerErr;
                                }
                            } else {
                                ctx.response.status = myDefault.badStatusCode;;
                                ctx.response.body = data.err;
                            }
                        } else {
                            if (args.indexOf(ctx) < 0) {
                                ctx.response.status = routeStatus || myDefault.okStatusCode;
                                ctx.response.body = data;
                            }
                        }
                    }
                    argList[1] = myFn;
                }
                fn(...argList);
                return this;
            }
        })
        return this;
    }

    setAgs(...ags) {
        this._nextRouteAgs = Array.from(ags);
    }

    setStatusCode(s) {
        this._nextRouteStatus = s;
    }

    setExceptionFilter(fn) {
        this._nextExceptionFilter = typeof fn === 'function' ? fn : null
    }

    async _parseAgs(ctx, routeAgs) {
        if (!Array.isArray(routeAgs)) {
            return [ctx];
        } else {
            const n = [];
            for (let i = 0; i < routeAgs.length; i++) {
                const tar = routeAgs[i];
                if (typeof tar === 'function') {
                    const res = tar(ctx);
                    if (res instanceof Promise) {
                        n[i] = await res;
                    } else {
                        n[i] = res;
                    }
                } else {
                    if (tar instanceof Promise) {
                        n[i] = await tar;
                    } else {
                        n[i] = tar;
                    }
                }
            }
            return n;
        }
    }
}

module.exports = {
    EasyRouter,
    getUserID: (ctx) => ctx.miUser && ctx.miUser.UserID || -1,
    getBody: (ctx) => ctx.request.body,
    getQuery: (ctx) => ctx.query,
    getCtx: (ctx) => ctx
}