const TipsCollection = require('../../../share/utils/tipsCollection');
const config = require('../config/');
const baseReq = require('./baseReq');
const isErr = require('../../../../util/').isReqError;
const ModuleTip = require('../../../share/models/').ModuleTip;
const topBaseReq = require('../../../share/utils/baseReq'),
    req = require('./req/'),
    moment = require('moment');
class ReservationTipsCollection extends TipsCollection {
    constructor(...sub) {
        super(...sub);
        this.id = config.moduleId;
    }

    async getNewTips(ctx) {
        const oriRes = Promise.resolve(new ModuleTip(this.id, 0));
        const body = ctx.request.body;
        const scoringTip = await this.getScoringTip(body.empno, ctx.miOption);
        let a = await topBaseReq.getPrivilege(this.id, ctx.miOption).catch((err) => err);
        let adminTip = 0;
        if (!isErr(a)) {
            this.privilegeList = JSON.parse(a);
            const serverList = await req.getServerList({
                empno: body.empno
            }, ctx.miOption);
            const outTimeTips = serverList.filter(s => new Date().getTime() - new Date(moment(s.SERVICE_DATE).format('YYYY-MM-DDT') + (s.END_TIME ? s.END_TIME : '')).getTime() > 0).length;
            const waittingTips = serverList.filter(s => s.STATUS === 'New').length;
            adminTip = adminTip + outTimeTips + waittingTips;
        } else {
            return oriRes
        }
        return Promise.resolve(new ModuleTip(this.id, scoringTip + adminTip));
    }
    hasPrivilege() {
        if (this.privilegeList && this.privilegeList.length > 0) {
            for (let i = 0; i < this.privilegeList.length; i++) {
                if (this.privilegeList[i].ROLE_NAME === 'RESERVATION_ADMIN') {
                    return true;
                }
            }
        }
        return false;
    }

    async getScoringTip(person, reqOpt) {
        return baseReq.getApplications({
            contact: person,
            status: 'Scoring'
        }, reqOpt).then(l => l.length);
    }
}

module.exports = new ReservationTipsCollection();