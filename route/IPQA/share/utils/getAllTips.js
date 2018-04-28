const TipsCollection = require('../../../share/utils/tipsCollection');
const config = require('../config/');
const getBossTips = require('./getBossTips');
const getEquipTips = require('./getEquipTips');
const getIPQATips = require('./getIPQATips');
const topBaseReq = require('../../../share/utils/baseReq');
const requestOption = require('../../../../util/requestOption');
const isErr = require('../../../../util/').isReqError;
const rxjs = require('rxjs');
const ModuleTip = require('../../../share/models/').ModuleTip;
class IPQATipsCollection extends TipsCollection {
    constructor(...sub) {
        super(...sub);
        this.id = config.moduleId;
    }

    async getNewTips(ctx, ids) {
        let oriRes = Promise.resolve(new ModuleTip(this.id, 0));
        if (!ids) {
            let a = await topBaseReq.getPrivilege(this.id, ctx.miOption).catch((err) => err);
            if (!isErr(a)) {
                this.privilegeList = JSON.parse(a);
            } else {
                return oriRes
            }
            if (this.subTipsCollection && this.subTipsCollection.length > 0) {
                let req = [];
                this.subTipsCollection.forEach((s) => {
                    if (this.hasPrivilege(s.id)) {
                        req.push(s.getNewTips(ctx, this.privilegeList));
                    }
                })
                return Promise.all(req).then((res) => {
                    let tips = 0;
                    res.forEach((r) => {
                        let t = r instanceof ModuleTip && r.TIPS || 0;
                        t = Number.isNaN(+t) ? 0 : t;
                        tips += t;
                    })
                    return new ModuleTip(this.id, tips, res)
                })
            } else {
                return oriRes
            }
        } else {
            return oriRes
        }
    }
    hasPrivilege(type) {
        type = type.toUpperCase();
        if (this.privilegeList && this.privilegeList.length > 0) {
            for (let i = 0; i < this.privilegeList.length; i++) {
                if (this.privilegeList[i].FUNCTION_NAME === type) {
                    return true;
                }
            }
        }
        return false;
    }

}

module.exports = new IPQATipsCollection(new getBossTips(), new getEquipTips(), new getIPQATips());