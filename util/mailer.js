const nodemailer = require('nodemailer'),
    db = require('../lib/oracleDB'),
    promisify = require('./').promisify;

const transporter = nodemailer.createTransport({
    //https://github.com/andris9/nodemailer-wellknown#supported-services 支持列表
    host: '10.86.0.220',
    port: 25, // SMTP 端口
});

/*
var mailOptions = {
    from: 'dfhyfgyhfgh45645@123.com', // 发件地址
    to: 'gary.h@mic.com.tw', // 收件列表
    subject: 'Hello sir', // 标题
    cc: '', // 抄送
    bcc: '', // 密抄送
    text： 'fdgfd',
    //text和html两者只支持一种
    html: '<b>Hello world 66666?</b><img src="cid:00000001"/>', // html 内容
    attachments: [{
        filename: 'ZenQcode.png',
        path: path.resolve(__dirname, '../cache/201810-dimission-analysis-subChart2.png'),
        cid: '00000001'
    },{
            filename: 'dff.xls',
            content: buffer
        }]
};*/

function backUpMailAfterSending({
    from,
    to,
    subject,
    cc = '',
    bcc = '',
    content
}) {
    let blocks = [];
    content = content.replace(/\'/g, '"').replace(/\r\n/g, "");
    while (content.length > 3000) {
        blocks.push(content.slice(0, 3000))
        content = content.slice(3000);
    }
    blocks.push(content);
    blocks = blocks.map(b => `'${b}'`).map(b => `v_content := v_content || ${b};`);
    const v_contentPre = blocks.join(' ');
    return db.execute(`
       DECLARE
        v_content   CLOB := '';
        begin
        ${v_contentPre}
        insert into moa_mail_log (mail_pending_id,
        mail_id,
        mail_from,
        mail_to,
        mail_cc,
        mail_bcc,
        subject,
        content,
        urgent_level,
        import_level,
        status,
        CREATE_BY,
        create_date,
        MAIL_DATE)
        values
        (moa_pending_mails_id.nextval,0,'${from}','${to}','${cc}','${bcc}','${subject}',v_content,1,1,1,-2,sysdate,sysdate);
        end;`, true).then(() => 'OK');
}

async function sendMail(mailOptions) {
    await promisify(transporter.sendMail.bind(transporter))(mailOptions);
    const backUp = Object.assign({}, mailOptions);
    backUp.content = backUp.html || backUp.text;
    return backUpMailAfterSending(backUp)
}



module.exports = sendMail;

// getPdfContentByURL('https://www.jianshu.com/p/7bc18767cb30').then((res) => {
//     var mailOptions = {
//         from: 'dfhyfgyhfgh45645@123.com', // 发件地址
//         to: 'gary.h@mic.com.tw', // 收件列表
//         subject: 'Hello sir', // 标题
//         //text和html两者只支持一种
//         html: '<b>Hello world 66666?</b><img src="cid:00000001"/>',
//     };


//     // send mail with defined transport object
//     sendMail(mailOptions).then(res => {
//         console.log(res);
//     })
// })

// const buffer = getExcel([1, 2], [
//     [45456, 56789]
// ])
// var mailOptions = {
//     from: 'dfhyfgyhfgh45645@123.com', // 发件地址
//     to: 'gary.h@mic.com.tw', // 收件列表
//     subject: 'Hello fgfsir', // 标题
//     //text和html两者只支持一种
//     html: '<b>Hello world 66666?</b><img src="cid:00000001"/>',
//     attachments: [{
//         filename: 'dff.xls',
//         content: buffer
//     }]
// };
// sendMail(mailOptions).then(res => {
//     console.log(res);
// })