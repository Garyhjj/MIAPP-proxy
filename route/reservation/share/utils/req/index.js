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
            if(+query.deptID > 0) {
                list = list.filter(l => +l.DEPT_ID === +query.deptID);
            }
            let statusList = ['New', 'Processing'];
            return list.filter(l => statusList.indexOf(l.STATUS) > -1);
        }
    },

    async updateApplication(query, reqOption) {
        const status = query.STATUS;
        if (+query.ID === 0) {
            const dayInfos = await baseReq.getServiceDayInfo({dept_id: query.DEPT_ID, date: query.SERVICE_DATE}, reqOption);
            const targetInfo = dayInfos.find(d => d.TIME_ID === query.TIME_ID);
            if(!targetInfo) {
                return {
                    statusCode: 400,
                    error: '申请服务失败, 无该时间段'
                };
            }
            const date = query.SERVICE_DATE;
            if (!testTime(date, query.END_TIME, targetInfo.PRE_MIN_MINUTE)) {
                return {
                    statusCode: 400,
                    error: '已超时，申请服务失败'
                };
            }
            if(+targetInfo.REMAIN_NUMBER < 1) {
                return {
                    statusCode: 400,
                    error: '申请服务失败, 无剩余号数'
                };
            }
        }else{
            if(status === 'Processing') {
                const apps = await baseReq.getApplications({docno: query.DOCNO}, reqOption);
                if(apps.length === 0) {
                    return {
                        statusCode: 400,
                        error: '更新的单据不存在'
                    };
                }
                const app = apps[0];
                const qHandler = query.HANDLER;
                const sHandler = app.HANDLER;
                if(!qHandler) {
                    return {
                        statusCode: 400,
                        error: '不能无单据处理人'
                    };
                }
                if(sHandler && sHandler !== qHandler) {
                    return {
                        statusCode: 400,
                        error: '该单据已被人抢了,请刷新'
                    }
                }
            }
            
            if(status === 'Scoring' && Array.isArray(query.newImpressionList)) {
                newImpressionList = query.newImpressionList;
                if(newImpressionList.length > 0) {
                    const req = [];
                    newImpressionList.forEach(i => {
                        req.push(baseReq.updateImpression({
                            ID: 0,
                            SERVICE_ID: query.ID,
                            IMPRESSION_ID: i,
                            EMPNO: query.HANDLER
                        }, reqOption))
                    });
                    await Promise.all(req);
                }
            }
        }
        delete query.newImpressionList;
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