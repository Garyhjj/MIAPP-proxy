const db = require('../lib/oracleDB');

const apiDescriptionGroups = [];

function observerRouter(router) {
    let way = ['get', 'delete', 'post', 'put'];
    router.hasDesLayer = [];
    router.hasDes = false;
    way.forEach(w => {
        const fn = router[w].bind(router);
        router[w] = function () {
            if (this.hasDes) {
                this.hasDesLayer.push({
                    path: arguments[0].slice(1),
                    method: w
                });
                this.hasDes = false;
            }
            fn(...arguments);
            return this;
        }
    })
    return router;
}
const dbType = {
    2003: `date`,
    2002: 'number',
    2001: 'string'
}
const tableDefinesCache = Object.create(null);

function getTableDefineString(tableName) {
    let cache = tableDefinesCache[tableName];
    if (cache) {
        return Promise.resolve(cache);
    } else {
        return db.execute(`select * from ${tableName} where rownum = 1`).then(res => res.metaData).then((metaData) => {
            const middle = Object.create(null);
            if (Array.isArray(metaData)) {
                metaData.forEach(m => {
                    middle[m.name] = dbType[m.fetchType] ? dbType[m.fetchType] : 'string'
                })
            }
            let tableDefine = ``;
            for (let prop in middle) {
                tableDefine = tableDefine ? tableDefine + ',\r\n' : '\r\n' + tableDefine;
                tableDefine += `${prop}: ${middle[prop]}`;
            }
            tableDefinesCache[tableName] = tableDefine;
            return tableDefine;
        })
    }
}
class RouteDescriptionFactory {
    constructor(layer, params) {
        const method = layer.method;
        const path = layer.path;
        switch (method) {
            case 'get':
            case 'delete':
            case 'post':
            case 'put':
                return new RouteDescription(path, method, params, getTableDefineString);
            default:
                return null
        }
    }
}
class RouteDescription {
    constructor(path, method, params, getTableDefineString) {
        this.getTableDefineString = getTableDefineString;
        this.info = {
            route: path,
            des: [{
                method: method.toUpperCase(),
                parmas: []
            }]
        }
        this.initParams(params);
    }
    initParams(params) {
        if (typeof params === 'object' && params) {
            let des = this.info.des[0];
            des.tip = params.tip;
            if (Array.isArray(params.params)) {
                const p = params.params;
                des.parmas = p;
                des.url_example = '';
                p.forEach(p => {
                    if (p.example) {
                        const text = `${p.name}=${p.example}`;
                        des.url_example = des.url_example ? des.url_example + '&' + text : '?' + text;
                    }
                    if (!p.hasOwnProperty('canNull')) {
                        p.canNull = true;
                    }
                })
            }
            const getTableDefineString = (table, cb) => {
                this.getTableDefineString(table).then((res) => {
                    cb && cb(`{${res}\r\n}`);
                }).catch((err) => {
                    console.error(err)
                })
            }
            des.body = params.body || '';
            des.body_example = params.body_example || '';
            if (params.bodyFromTable) {
                getTableDefineString(params.bodyFromTable, (data) => {
                    des.body = data + (params.bodyCanArray ? 'or this[]' : '');
                });
            }
            if (params.results) {
                const results = params.results;
                if (Array.isArray(results)) {
                    des.results = results;
                } else {
                    des.results = [results];
                }
                des.results.forEach((r) => {
                    if (r.fromTable) {
                        getTableDefineString(r.fromTable, (data) => {
                            r.data = data + (r.dataIsArray ? '[]' : '');
                        });
                    }
                })
            }
        }
    }
}

class ApiDescriptionGroup {
    constructor(router) {
        this.info = {};
        this.router = observerRouter(router);
        this.desList = [];
        this.idx = 0;
        if (router && router.opts) {
            this.info.prefix = router.opts.prefix ? router.opts.prefix.replace(/\//g, '') : '/'
        }
        this.info.routes = [];
        apiDescriptionGroups.push(this);
    }

    add(params) {
        if (!this.router.hasDes) {
            this.router.hasDes = true;
        } else {
            this.des.pop();
        }
        this.desList.push(params);
        this._initRouteDescriptions();
    }

    _initRouteDescriptions() {
        if (this.time) {
            clearTimeout(this.time);
        }
        this.time = setTimeout(() => {
            this.time = null;
            const desList = this.desList,
                hasDesLayer = this.router.hasDesLayer;
            desList.forEach((d, idx) => {
                const l = hasDesLayer[idx];
                if (!l.finishedDes) {
                    const routes = this.info.routes;
                    const des = new RouteDescriptionFactory(l, d);
                    if (des) {
                        const tar = routes.find(r => r.info.route === des.info.route);
                        if (tar) {
                            tar.info.des.push(des.info.des[0]);
                        } else {
                            routes.push(des);
                        }
                    }
                    l.finishedDes = true;
                }
            })
        }, 50)
    }
}


module.exports = {
    apiDescriptionGroups,
    ApiDescriptionGroup
}