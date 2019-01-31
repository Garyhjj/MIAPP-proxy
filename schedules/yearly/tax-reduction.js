const ejs = require('consolidate').ejs,
    sendMail = require('../../util/mailer'),
    path = require('path'),
    reductionTable = require('../../tables/tax/moa_tax_reduction'),
    db = require('../../lib/oracleDB'),
    moment = require('moment');

const taxType = {
        CHILD_EDUCATION: 'CHILD_EDUCATION',
        CONTINUING_EDUCATION: 'CONTINUING_EDUCATION',
        HOME_LOAN: 'HOME_LOAN',
        HOME_RENT: 'HOME_RENT',
        SERIOUS_ILL: 'SERIOUS_ILL',
        SUPPORT_ELDER: 'SUPPORT_ELDER'
    },
    company_name = 'MSL';
// const html = ejs(path.resolve(__dirname, '../views/tax-reduction.ejs'), {
//     title: 'home'
// }).then((html) => {
//     console.log(html)
//     var mailOptions = {
//         from: 'dfhyfgyhfgh45645@123.com', // 发件地址
//         to: 'gary.h@mic.com.tw', // 收件列表
//         subject: 'Hello sir', // 标题
//         //text和html两者只支持一种
//         html: html,
//     };


//     // send mail with defined transport object
//     sendMail(mailOptions).then(res => {
//         console.log(res);
//     })
// })


async function sendOne(tar) {
    let res = {
        title: '上年度个税专项附加扣除申请明细'
    };
    const reqs = Object.keys(taxType).map((k) => reductionTable.getLastestReduction(taxType[k], tar, company_name, 'A').then((d) => {
        res[k] = d.map(_ => {
            _.CREATION_DATE = moment(_.CREATION_DATE).format('YYYY-MM-DD');
            _.START_DATE = _.START_DATE && moment(_.START_DATE).format('YYYYMM');
            _.END_DATE = _.START_DATE && moment(_.END_DATE).format('YYYYMM');
            return _;
        });
    }));

    await Promise.all(reqs);
    let hasData;
    Object.keys(taxType).forEach((k) => {
        if (res[k] && res[k].length > 0) {
            hasData = true;
        }
    })
    if (!hasData) {
        return;
    }
    const {
        USER_NAME,
        EMAIL
    } = await db.execute(`select USER_NAME, EMAIL from moa_gl_users where id = ${tar}`).then(r => r.rows[0] || {});
    res.user = USER_NAME;
    if (USER_NAME && EMAIL) {
        const html = await ejs(path.resolve(__dirname, '../views/tax-reduction.ejs'), res);
        let mailOptions = {
            from: 'tax.reduction@mic.com', // 发件地址
            to: 'gary.h@mic.com.tw', // 收件列表
            subject: 'Hello sir', // 标题
            //text和html两者只支持一种
            html: html,
        };
        // send mail with defined transport object
        sendMail(mailOptions).then(res => {
            console.log(res);
        })
    }
}
async function doSchedule() {
    const userList = await db.execute(`select distinct(user_id) from ${reductionTable.tableName} where user_id is not null`).then(rs => rs.rows.map(r => r.USER_ID));
    console.log(userList);
    userList.forEach((tar) => {
        sendOne(tar)
    });
}

doSchedule()