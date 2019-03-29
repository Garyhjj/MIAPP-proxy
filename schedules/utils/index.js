 const db = require('../../lib/oracleDB'),
     fakeToken = require('../../util').fakeToken,
     sendMail = require('../../util/mailer');

 function formatMail(mail) {
     return Array.isArray(mail) ? mail.join(';') : mail
 }
 async function getMail(empnos) {
     if (!empnos) return;
     empnos = Array.isArray(empnos) ? empnos : [empnos];
     return Promise.all(empnos.map((n) => {
         return db.execute(`SELECT email FROM moa_gl_users WHERE empno = '${n}' or email = '${n}'`).then(r => {
             const l = r.rows;
             return l.length > 0 ? l[0].EMAIL : n
         })
     }))
 }

 module.exports = {
     getMail,
     sendMail,
     sendCommonMail: async (mailTo, title, content, mailFrom, mailCC, mailBCC) => {
         let blocks = [];
         while (content.length > 3000) {
             blocks.push(content.slice(0, 3000))
             content = content.slice(3000);
         }
         blocks.push(content);
         blocks = blocks.map(b => `'${b}'`).map(b => `v_content := v_content || ${b};`);
         const v_contentPre = blocks.join(' ');
         mailFrom = mailFrom || '';
         mailCC = mailCC || '';
         mailBCC = mailBCC || '';
         return db.execute(`
                    DECLARE
                    v_content   CLOB := '';
                    begin
                    ${v_contentPre}
                    moa_send_mail_pkg.SEND_COMMON_MAIL2('${formatMail(mailTo)}',
                        '${title}',
                        v_content,
                        '${mailFrom}',
                        '${formatMail(mailCC)}',
                        '${formatMail(mailBCC)}');
                    end;
        `, true)
     },
     async goToMobileApp(page) {
         console.log(789)
         await page.goto('http://miwebapi.mic.com.cn/');
         const tokenMes = fakeToken();
         await page.evaluate((tk) => {
             const {
                 token,
                 exp
             } = tk;
             localStorage.setItem('access_token', JSON.stringify(token));
             localStorage.setItem('tokenExpires', exp);
         }, tokenMes);
         return await page.waitFor(1000);
     },
     defaultAdminMail: 'gary.h@mic.com.tw'
 }