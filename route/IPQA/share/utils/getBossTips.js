const TipsCollection = require('../../../share/utils/tipsCollection');
const config = require('../config/');
const rxjs = require('rxjs');
const bossReq = require('./boss-req/');
const baseReq = require('./baseReq');
const topUtils = require('../../../../util/');
const isModuleAdmin = topUtils.isModuleAdmin;
const isSuperUser = topUtils.isSuperUser;
class BossTipsCollection extends TipsCollection {
    constructor() {
        super();
        this.id = config.boss
    }

    getNewTips(ctx,list) {
        this.privilegeList = list;
        console.log(isModuleAdmin(list,this.id));
        console.log(isSuperUser(list,this.id));
        this.getAdminTotalTips(ctx);
        return this.getOwnUndoneTips(ctx);
    }

    getOwnUndoneTips(ctx) {
        return bossReq.getOwnUndoneReport(ctx).map((a) => a.reduce((a,b) => a.length + b.length),0).toPromise();
    }
    
    async getAdminTotalTips(ctx,isAdmin) {
        if(!this.privilegeList || !isModuleAdmin(this.privilegeList,this.id)) return Promise.resolve(0);
        let query = ctx.request.body || {};
        let company_name = query.company_name;
        let mriL = await baseReq.getMriName({type:this.id,company_name:company_name},topUtils.requestOption(ctx)).catch((err) => err);
        console.log(mriL);
    }
}

module.exports = BossTipsCollection;