const db = require('../../lib/oracleDB.js'),
ejs = require('consolidate').ejs,
    sendMail = require('../../util/mailer'),
    path = require('path'),
    sortUtils = require('../../util').sortUtils,
    defaultAdminMail = require('../utils').defaultAdminMail,
moment = require('moment');


function sortByTime(a, b, type) {
    return sortUtils.byDate(
      moment(a.SERVICE_DATE).format('YYYY-MM-DD ') + a.START_TIME,
      moment(b.SERVICE_DATE).format('YYYY-MM-DD ') + b.START_TIME,
      type,
    );
  }
async function getUnDoneList() {
    const list  = await db.search(`SELECT A.*,(SELECT NICK_NAME FROM MOA_GL_USERS WHERE EMPNO = A.CONTACT) AS CONTACT_NAME
    ,(SELECT NICK_NAME FROM MOA_GL_USERS WHERE EMPNO = A.HANDLER) AS HANDLER_NAME
     FROM MOA_SERVICES A WHERE STATUS IN ('New','Processing')`);
    list.forEach(l => {
        const {SERVICE_DATE} = l;
        l.service_time = moment(SERVICE_DATE).format('YYYY-MM-DD ') + ` ${l.START_TIME} ~ ${l.END_TIME}`;
        l.CONTACT = l.CONTACT_NAME + l.MOBILE;
        const date =
          moment(l.SERVICE_DATE).format('YYYY-MM-DD') + ' ' + l.END_TIME;
        if (Date.now() - new Date(date).getTime() > 0) {
          l.class = 'out-time';
        } else {
          const startTime =
          moment(l.SERVICE_DATE).format('YYYY-MM-DD') + ' ' + l.START_TIME;
          const aheadTime = new Date(startTime).getTime() - Date.now(),
            oneDay = 1000 * 60 * 60 * 24;
          if (aheadTime <= oneDay) {
            // dayTask.push(l);
            l.class = 'day-task'
          } else if (aheadTime <= oneDay * 7) {
            // weekTask.push(l);
            l.class = 'week-task'
          } else if (aheadTime <= oneDay * 30) {
            l.class = 'month-task'
          }
          // normal.push(l);
        }
    })
    return list.sort((a,b) => sortByTime(a,b,true));
}

async function doSchedule() {
    const res = await getUnDoneList();
    const html = await ejs(path.resolve(__dirname, '../views/undone-reservation.ejs'), {list:res,title: 'IT服務預約之未完成單據'});
        const mailOptions = {
            from: 'it.reservation@mic.com', // 发件地址
            to: 'MSL_ITService@mic.com.tw;jb.hu@mic.com.tw;' + defaultAdminMail, // 收件列表
            subject: 'IT服務預約之未完成單據', // 标题
            //text和html两者只支持一种
            html: html,
        };
        // send mail with defined transport object
        sendMail(mailOptions).then(res => {
            console.log(res);
        })
}

module.exports = {doSchedule};