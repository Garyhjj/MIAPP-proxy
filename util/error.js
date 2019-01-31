const db = require('../lib/oracleDB');

async function sendErrorMail(title, errMes, admin = 'FX823') {
    const mail = await db.execute(`SELECT email FROM moa_gl_users WHERE empno = '${admin}'`).then(r => {
        const l = r.rows;
        return l.length > 0 ? l[0].EMAIL : ''
    })
    return db.execute(`
        begin
        moa_send_mail_pkg.SEND_COMMON_MAIL('${mail}',
        '${title}',
        '${errMes}',
        'mitac_oa_error.mail@mic.com.tw',
        '',
        ''
        );
        end;`, true)
}

function errMailInformDecorator(fn, title, admin) {
    if (typeof fn !== 'function') return;
    return (...args) => {
        let res;
        try {
            res = fn.apply(null, args);
            if (res instanceof Promise) {
                return res.catch((e) => {
                    sendErrorMail(title, e.message, admin);
                    return Promise.reject(e)
                })
            } else {
                return res;
            }
        } catch (e) {
            sendErrorMail(title, e.message, admin);
            return e;
        }

    }
}

module.exports = {
    sendErrorMail,
    errMailInformDecorator
}