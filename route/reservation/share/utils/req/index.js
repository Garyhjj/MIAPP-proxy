const request = require("request-promise-native");
const baseReq = require("../baseReq");
const rxjs = require("rxjs");
const util = require("../../../../../util/");
const isArray = Array.isArray,
  isErr = util.isReqError,
  httpErr400 = util.httpErr400,
  moment = require("moment"),
  updateWithLock = util.updateStoreWithLockResolver("reservation", "ID");
updateWithLock.isUniquekeyValid = data => data.ID > -1;
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
      if (+query.deptID > 0) {
        list = list.filter(l => +l.DEPT_ID === +query.deptID);
      }
      let statusList = ["New", "Processing"];
      return list.filter(l => {
        if (statusList.indexOf(l.STATUS) > -1) {
          if (l.STATUS === "Processing") {
            if (l.HANDLER !== query.empno) {
              return false;
            }
          }
          return true;
        }
        return false;
      });
    }
  },

  async updateApplication(query, reqOption) {
    const fn = async data => {
      const status = data.STATUS;
      let dayInfos;
      const addServiceLater = data.addServiceLater;
      const {
        CONTACT,
        HANDLER,
        STATUS
      } = data;
      if (+data.ID === 0) {
        dayInfos = await baseReq.getServiceDayInfo({
            dept_id: data.DEPT_ID,
            date: data.SERVICE_DATE
          },
          reqOption
        );
        if (!addServiceLater) {
          const targetInfo = dayInfos.find(d => d.TIME_ID === data.TIME_ID);
          if (!targetInfo) {
            return httpErr400("申请服务失败, 无该时间段");
          }
          const date = data.SERVICE_DATE;
          if (!testTime(date, data.END_TIME, targetInfo.PRE_MIN_MINUTE)) {
            return httpErr400("已超时，申请服务失败");
          }
          if (+targetInfo.REMAIN_NUMBER < 1) {
            return httpErr400("申请服务失败, 无剩余号数");
          }
        }
      } else {
        const apps = await baseReq.getApplications({
            docno: data.DOCNO
          },
          reqOption
        );
        if (apps.length === 0) {
          return httpErr400("更新的单据不存在");
        }
        const app = apps[0];
        const S_STATUS = app.STATUS;
        if (data.RESET_FLAG === "Y" && status === "New") {
          if (["Scoring", "Closed", "CX"].indexOf(S_STATUS) > -1) {
            return httpErr400("该单据不能被重置, 请刷新");
          }
        }
        if (status === "Processing") {
          const qHandler = data.HANDLER;
          const sHandler = app.HANDLER;
          if (!qHandler) {
            return httpErr400("不能无单据处理人");
          }
          if (sHandler && sHandler !== qHandler) {
            return httpErr400("该单据已被人抢了,请刷新");
          }
          if(!app.FIRST_RESPONSE_TIME && S_STATUS === 'New') {
            data.FIRST_RESPONSE_TIME = moment().format('YYYY-MM-DDT HH:mm:ss');
          }
        }
        const Q_LAST_UPDATED_DATE = data.LAST_UPDATED_DATE;
        const S_LAST_UPDATED_DATE = app.LAST_UPDATED_DATE;
        if (
          S_LAST_UPDATED_DATE &&
          !moment(Q_LAST_UPDATED_DATE).isSame(S_LAST_UPDATED_DATE)
        ) {
          return httpErr400("该单据已被更新,请刷新");
        }
        if (status === "Closed" && Array.isArray(data.newImpressionList)) {
          newImpressionList = data.newImpressionList;
          if (newImpressionList.length > 0) {
            const req = [];
            newImpressionList.forEach(i => {
              req.push(
                baseReq.updateImpression({
                    ID: 0,
                    SERVICE_ID: data.ID,
                    IMPRESSION_ID: +i,
                    EMPNO: data.HANDLER
                  },
                  reqOption
                )
              );
            });
            await Promise.all(req);
          }
        }
      }
      delete data.newImpressionList;
      delete data.images;
      if (addServiceLater) {
        const date = "2018-01-01";
        let req = [];
        const {
          fromTime,
          endTime
        } = data;
        // const fromTimeMoment = moment(date + " " + fromTime);
        // const endTimeMoment = moment(date + " " + endTime);
        const otherSet = {
          MANUAL_FLAG: "Y"
        };
        if (!data.STATUS) {
          if (CONTACT && HANDLER && CONTACT === HANDLER) {
            otherSet.STATUS = "Closed";
            otherSet.SCORE = 5;
          } else if (HANDLER) {
            otherSet.STATUS = "Scoring";
          } else {
            otherSet.STATUS = "New";
          }
        }
        // 取消拆分后逻辑

        data.START_TIME = fromTime;
        data.END_TIME = endTime;
        data.PROCESS_TIME = moment().format(
          "YYYY-MM-DDT " + fromTime
        );
        // 取消拆分
        // dayInfos &&
        //   dayInfos.forEach(day => {
        //     const { END_TIME, START_TIME } = day;
        //     const END_TIMEMoment = moment(date + " " + END_TIME);
        //     const START_TIMEMoment = moment(date + " " + START_TIME);
        //     if (
        //       fromTimeMoment.isBefore(END_TIMEMoment) &&
        //       endTimeMoment.isAfter(START_TIMEMoment)
        //     ) {
        //       req.push(
        //         Object.assign(
        //           {},
        //           data,
        //           Object.assign(
        //             {
        //               TIME_ID: day.TIME_ID,
        //               PROCESS_TIME: moment().format(
        //                 "YYYY-MM-DDT " + START_TIME
        //               ),
        //               END_TIME,
        //               START_TIME
        //             },
        //             otherSet
        //           )
        //         )
        //       );
        //     }
        //   });
        // const lg = req.length;
        // const HANDLE_TIME = data.HANDLE_TIME;
        // const averageHandleTime =
        //   !isNaN(HANDLE_TIME) && HANDLE_TIME > 0
        //     ? (HANDLE_TIME / lg).toFixed(4)
        //     : HANDLE_TIME;
        // req = req.map(prop =>
        //   baseReq.updateApplication(
        //     Object.assign({}, prop, {
        //       HANDLE_TIME: averageHandleTime
        //     }),
        //     reqOption
        //   )
        // );
        // return Promise.all(req);
        return baseReq.updateApplication({
          ...data,
          ...otherSet
        }, reqOption);
      } else {
        // 正常申请的单据,申请人与处理人一致，不需要评分，默认评分 20190308
        if (CONTACT && HANDLER && CONTACT === HANDLER && STATUS === 'Processing') {
          data.STATUS = "Closed";
          data.SCORE = 5;
        }
        return baseReq.updateApplication(data, reqOption);
      }
    };
    return updateWithLock.update(fn, query);
  }
};

function testTime(date, endTime, preTime) {
  const lastTime = date + " " + endTime;
  if (
    new Date(lastTime).getTime() - new Date().getTime() >
    preTime * 60 * 1000
  ) {
    return true;
  }
  return false;
}