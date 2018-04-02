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
        const body = ctx.request.body,
            empno = body.empno,
            miOption = ctx.miOption;
        const userTip = await Promise.all([this.getScoringTip(empno, miOption), this.getProcessingTip(empno, miOption)]).then(list => list.reduce((a, b) => a + b, 0));
        let a = await topBaseReq.getPrivilege(this.id, miOption).catch((err) => err);
        let adminTip = 0;
        if (!isErr(a)) {
            this.privilegeList = JSON.parse(a);
            if (this.hasPrivilege()) {
                adminTip = await Promise.all([await req.getServerList({
                    empno: empno
                }, miOption).then(l => l.length), this.getAdminScoringTip(empno, miOption)]).then(list => list.reduce((a, b) => a + b, 0));
            }
            // const outTimeTips = serverList.filter(s => new Date().getTime() - new Date(moment(s.SERVICE_DATE).format('YYYY-MM-DDT') + (s.END_TIME ? s.END_TIME : '')).getTime() > 0).length;
            // const waittingTips = serverList.filter(s => s.STATUS === 'New').length;
        } else {
            return oriRes
        }
        return Promise.resolve(new ModuleTip(this.id, userTip + adminTip));
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

    async getAdminScoringTip(person, reqOpt) {
        return baseReq.getApplications({
            handler: person,
            status: 'Scoring'
        }, reqOpt).then((ls) => ls.filter(l => l.CONTACT !== person)).then(l => l.length);
    }

    async getProcessingTip(person, reqOpt) {
        return baseReq.getApplications({
            contact: person,
            status: 'Processing'
        }, reqOpt).then(l => l.length);
    }
}

module.exports = new ReservationTipsCollection();