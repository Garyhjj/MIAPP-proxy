const apiDescriptionGroups = [require('../config/api/description/route/users'), require('../config/api/description/route/IPQA'),
    require('../config/api/description/route/reservation')
];

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
class RouteDescriptionFactory {
    constructor(layer, params) {
        const method = layer.method;
        switch (method) {
            case 'get':
                return new RouteGetDescription(layer.path, params);
        }
    }
}

class RouteGetDescription {
    constructor(path, params) {
        return {
            info: {
                route: path,
                des: [{
                    method: 'GET',
                    parmas: [{
                            name: 'role',
                            type: 'number类型,1超级管理员,2普通管理员,3普通使用者',
                            canNull: true,
                        },
                        {
                            name: 'type',
                            type: '巡检类别: boss、equip',
                            canNull: true,
                        },
                        {
                            name: 'company_name',
                            type: 'string类型: MSL',
                            canNull: true,
                        }
                    ],
                    results: [{
                        code: 200,
                        data: `非负整数`
                    }],
                    tip: '获得对于管理员的提醒数',
                    url_example: '?role=1&type=boss&company_name=MSL'
                }]
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
                    this.info.routes.push(new RouteDescriptionFactory(l, d));
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