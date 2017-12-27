const TipsCollection = require('../../../share/utils/tipsCollection');
const config = require('../config/');
const rxjs = require('rxjs');
const bossReq = require('./boss-req/');
const baseReq = require('./baseReq');
const topUtils = require('../../../../util/');
const getRole = topUtils.getRole;
const isErr = require('../../../../util/').isReqError;
const moment = require('moment');
class BossTipsCollection extends TipsCollection {
    constructor() {
        super();
        this.id = config.boss
    }

    async getNewTips(ctx, list) {
        let role = getRole(list,this.id);
        return Promise.all([this.getOwnUndoneTips(ctx), this.getAdminTotalTips(ctx,{role}),this.getOwnTaskTips(ctx)]).then((res) => res.reduce((a, b) => a + b, 0));
    }

    getOwnUndoneTips(ctx) {
        let query = ctx.request.body;
        let send = {type:this.id};
        Object.assign(send,query);
        let option = ctx.miOption;
        return bossReq.getOwnUndoneReport(send, option).map((a) => a.length).toPromise();
    }

    async getOwnTaskTips(ctx) {
        let query = ctx.request.body;
        return rxjs.Observable.fromPromise(baseReq.getEmployeeSchedule({company:query.company_name},ctx.miOption)).map((d) => d.filter((l) => +l.REPORT_ID === 0).length).toPromise();
    }
    async getAdminTotalTips(ctx, opts) {
        let myOpt = opts || {};
        let role = opts.role;
        if (!role || role === 3) return Promise.resolve(0);
        let query = ctx.request.body || {};
        Object.assign(query,opts);
        let company_name = query.company_name;
        let miOption = ctx.miOption;
        let mriL = await baseReq.getMriName({
            type: this.id,
            company_name: company_name
        }, miOption).catch((err) => err);
        if (isErr(mriL) || mriL.length === 0) {
            return Promise.resolve(0);
        } else {
            if (role !== 1) {
                mriL = mriL.filter((l) => l.ADMIN_EMPNO === query.empno);
            }
            let req = [];
            let from = moment(Date.parse(new Date().toString()) - 1000 * 60 * 60 * 24 * 30).format('YYYY-MM-DD');
            let to = moment(Date.parse(new Date().toString())).format('YYYY-MM-DD');
            let trackQuery = {
                dateFM: from,
                dateTO: to,
                company_name: company_name
            };
            mriL.forEach((l) => {
                trackQuery.nameID = l.NAME_ID;
                req.push(rxjs.Observable.fromPromise(baseReq.getProblemTrack(trackQuery, miOption)).map((list) => list ? list : []))
            })
            return rxjs.Observable.forkJoin(...req).map((res) => {
                return res.map((list) => {
                    return list.filter((i) => i.PROBLEM_FLAG === 'Y' && i.PROBLEM_STATUS === 'New')
                }).map((l) => l.length).reduce((a, b) => a + b, 0)
            }).toPromise();
        }
    }
}

module.exports = BossTipsCollection;