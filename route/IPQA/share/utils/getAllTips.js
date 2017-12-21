const TipsCollection = require('../../../share/utils/tipsCollection');
const config = require('../config/');
const getBossTips = require('./getBossTips');
const topBaseReq = require('../../../share/utils/baseReq');
const requestOption = require('../../../../util/requestOption');
const isErr = require('../../../../util/').isReqError;
const rxjs = require('rxjs');

class IPQATipsCollection extends TipsCollection {
    constructor(sub) {
        super(sub);
        this.id = config.moduleId;
    }

    async getNewTips(ctx, ids) {
        if (!ids) {
            let a = await topBaseReq.getPrivilege(this.id, requestOption(ctx)).catch((err) => err);
            if (!isErr(a)) {
                this.privilegeList = JSON.parse(a);
            } else {
                return Promise.resolve({
                    moduleId: this.id,
                    tips: 0
                });
            }
            if (this.subTipsCollection && this.subTipsCollection.length > 0) {
                let req = [];
                this.subTipsCollection.forEach((s) => {
                    if (this.hasPrivilege(s.id)) {
                        req.push(s.getNewTips(ctx,this.privilegeList));
                    }
                })
                return Promise.all(req).then((res) => {
                    let tips = 0;
                    res.forEach((r) => {
                        let t = r.tips | 0;
                        tips +=t;
                    })
                    return {
                        moduleId: this.id,
                        tips: tips
                    }
                })
            } else {
                return Promise.resolve({
                    moduleId: this.id,
                    tips: 0
                });
            }
        } else {
            return Promise.resolve({
                moduleId: this.id,
                tips: 0
            });
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

module.exports = new IPQATipsCollection(new getBossTips());