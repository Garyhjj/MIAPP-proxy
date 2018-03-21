const request = require('request-promise-native');
const baseReq = require('../baseReq');
const rxjs = require('rxjs');
const util = require('../../../../../util/');
const isArray = Array.isArray,
    isErr = util.isReqError;

module.exports = {
    async getServerList(query, reqOption) {
        let res = await baseReq.getPersonList(query, reqOption).catch(err => err);
        if (isErr(res)) {
            return [];
        } else {
            let list = await baseReq.getApplications(query, reqOption);
            if (query.empno) {
                const empno = query.empno;
                let serveList = res.filter(p => p.EMPNO === empno);
                serveList = serveList.filter((l, idx) => {
                    const index = serveList.findIndex(s => s.DEPT_ID === l.DEPT_ID);
                    return index === idx;
                });
                const deptIDList = serveList.map(s => s.DEPT_ID);
                list = list.filter(l => deptIDList.indexOf(l.DEPT_ID) > -1);
            }
            let statusList = ['New', 'Processing'];
            return list.filter(l => statusList.indexOf(l.STATUS) > -1);
        }
    },

    async updateApplication(query, reqOption) {
        if (query.ID === 0) {
            const dayInfos = await baseReq.getServiceDayInfo({dept_id: query.DEPT_ID, date: date});
            const targetInfo = dayInfos.find(d => d.ID === query.TIME_ID);
            if(!targetInfo) {
                return {
                    status: 400,
                    error: '申请服务失败, 无该时间段'
                };
            }
            const date = query.SERVICE_DATE;
            if (!testTime(date, query.END_TIME, deptMes.PRE_MIN_MINUTE)) {
                return {
                    status: 400,
                    error: '已超时，申请服务失败'
                };
            }
            if(+targetInfo.REMAIN_NUMBER < 1) {
                return {
                    status: 400,
                    error: '申请服务失败, 无剩余号数'
                };
            }
        }
        return baseReq.updateApplication(query, reqOption);
    }
}

function testTime(date, endTime, preTime) {
    const lastTime = date + ' ' + endTime;
    if (new Date(lastTime).getTime() - new Date().getTime() > preTime * 60 * 1000) {
        return true;
    }
    return false;
}