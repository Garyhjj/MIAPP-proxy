const TipsCollection = require('../../../share/utils/tipsCollection');
const config = require('../config/');
const attBaseReq = require('./baseReq');
const isErr = require('../../../../util/').isReqError;
const ModuleTip = require('../../../share/models/').ModuleTip;
const rxjs = require('rxjs');

class AttTipsCollection extends TipsCollection {
    constructor(...sub) {
        super(...sub);
        this.id = config.moduleId;
    }

    async getNewTips(ctx) {
        let res = await attBaseReq.getOffDutyException(ctx.miOption).then((ls) => ls.length).catch(err =>err);
        if(isErr(res)) {
            return Promise.resolve(new ModuleTip(this.id,0));
        }else {
            return Promise.resolve(new ModuleTip(this.id,res));
        }  
    }
}

module.exports = new AttTipsCollection();