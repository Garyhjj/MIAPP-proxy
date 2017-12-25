const TipsCollection = require('../../../share/utils/tipsCollection');
const config = require('../config/');
const rxjs = require('rxjs');
const IPQAReq = require('./IPQA-req/');
const baseReq = require('./baseReq');
const topUtils = require('../../../../util/');
const getRole = topUtils.getRole;
const isErr = require('../../../../util/').isReqError;
class IPQATipsCollection extends TipsCollection {
    constructor() {
        super();
        this.id = config.IPQA
    }

    async getNewTips(ctx, list) {
        let role = getRole(list,this.id);
        let res;
        if(role === 1) {
            res = await IPQAReq.getAdminExcReports(Object.assign({type:this.id},ctx.request.body),ctx.miOption).map((ls) => ls.length).toPromise();
        } else {
            res = await IPQAReq.getNormalExcReports(Object.assign({type:this.id},ctx.request.body),ctx.miOption).map((ls) => ls.length).toPromise();
        }
        return Promise.resolve(res);
    }
}

module.exports = IPQATipsCollection;