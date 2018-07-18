const moment = require('moment'),
    util = require("../../util"),
    assert = util.assert,
    db = require("../../lib/oracleDB");

function toStoreDate(date, format) {
    format = format || 'yyyymmdd HH24:Mi:SS';
    const m = moment(date);
    if (date && m.isValid()) {
        return `to_date('${
            m.format('YYYYMMDD HH:mm:ss')
          }','${format}')`
    } else {
        return `''`
    }
}

function toStoreString(s) {
    if (typeof s === 'string') {
        s = s.replace(/\'/g, "’").replace(/\;/, "；");
        return `'${s}'`;
    } else {
        return `''`;
    }
}

function valueTestAndFormat(target, out, name, test) {
    if (target.hasOwnProperty(name)) {
        if (target[name] !== null && target[name] !== void(0) && target[name] !== '') {
            test();
        } else {
            out[name] = `''`;
        }

    }
}

function valueTestAndFormatString(target, out, name) {
    valueTestAndFormat(target, out, name, () => {
        const type = typeof target[name];
        assert(type === "string" || type === 'number' || type === 'boolean', `${name} 必须为文本类型`);
        out[name] = toStoreString(target[name]);
    })
}

function valueTestAndFormatNumber(target, out, name) {
    valueTestAndFormat(target, out, name, () => {
        assert(typeof + target[name] === "number" && !Number.isNaN(+target[name]), `${name} 必须为数字类型`);
        out[name] = +target[name];
    })
}

function valueTestAndFormatDate(target, out, name, format) {
    valueTestAndFormat(target, out, name, () => {
        assert(typeof moment(target[name]).isValid, `${name} 必须为日期格式`);
        out[name] = toStoreDate(target[name], format);
    })
}

function valueTestAndFormatJSON(target, out, name) {
    valueTestAndFormat(target, out, name, () => {
        let val = target[name];
        try {
            val = JSON.stringify(val);
            out[name] = toStoreString(val);
        } catch (e) {
            assert(true, `${name} 必须为json格式`)
        }
    })
}


function getChangeProp(new_data, old_data, ignore) {
    const changeProp = [];
    for (let prop in old_data) {
        if (ignore.indexOf(prop) > -1) {
            continue;
        }
        if (new_data.hasOwnProperty(prop)) {
            const old_val = old_data[prop];
            const new_val = new_data[prop];
            if (old_val instanceof Date) {
                if (old_val.getTime() !== new Date(new_val).getTime()) {
                    changeProp.push(prop);
                }
            } else {
                if (old_val !== new_val) {
                    changeProp.push(prop);
                }
            }
        }
    }
    return changeProp
}

let sendMailPromise;
const sendMail = () => {
    return new Promise((resolve) => {
        if (sendMailPromise) {
            resolve(sendMailPromise);
        } else {
            sendMailPromise = new Promise((resolve) => {
                setTimeout(() => {
                    sendMailPromise = null;
                    resolve(db.execute(`
                    begin
                    MIOA.moa_send_mail_pkg.main;
                    end;
                    `, true));
                }, 3000);
            })
        }
    })
}

module.exports = {
    toStoreDate,
    toStoreString,
    valueTestAndFormat,
    valueTestAndFormatString,
    valueTestAndFormatNumber,
    valueTestAndFormatDate,
    valueTestAndFormatJSON,
    getChangeProp,
    sendMail
}