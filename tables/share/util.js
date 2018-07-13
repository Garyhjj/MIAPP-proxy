const moment = require('moment'),
    util = require("../../util"),
    assert = util.assert,
    db = require("../../lib/oracleDB");

function toStoreDate(date) {
    const m = moment(date);
    if (date && m.isValid()) {
        return `to_date('${
            m.format('YYYYMMDD HH:mm:ss')
          }','yyyymmdd HH24:Mi:SS')`
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

function valueTestAndFormatDate(target, out, name) {
    valueTestAndFormat(target, out, name, () => {
        assert(typeof moment(target[name]).isValid, `${name} 必须为日期格式`);
        out[name] = toStoreDate(target[name]);
    })
}

function normalDelete(tableName, safePass) {
    return (ID, by) => db.execute(`update ${tableName} SET DELETE_FLAG =  'Y', LAST_UPDATED_DATE = ${toStoreDate()}, LAST_UPDATED_BY= ${by} where id = ${safePass({ID}).ID}`)
}

function normalUpdate(tableName, safePass, set) {
    return async (project, by, opts) => {
        const outBeforeUpdate = set && set.beforeUpdate;
        if (typeof outBeforeUpdate === 'function') {
            const res = outBeforeUpdate(project);
            if (res instanceof Promise) {
                project = await res;
            } else if (typeof res === 'object') {
                project = res;
            }
        }
        let saveProject;
        if (typeof safePass === 'function') {
            try {
                saveProject = safePass(Object.assign({}, project));
            } catch (e) {
                return Promise.reject(e.message);
            }
        } else {
            saveProject = project;
        }
        const afterUpdate = opts && opts.afterUpdate;
        if (saveProject.ID > 0) {
            const old = await db.execute(`select * from ${tableName} where ID = ${saveProject.ID}`).then(res => {
                if (Array.isArray(res.rows) && res.rows.length > 0) {
                    return res.rows[0];
                }
            });
            if (old) {
                const OUT_LAST_UPDATED_DATE = project.LAST_UPDATED_DATE;
                const STORE_LAST_UPDATED_DATE = old.LAST_UPDATED_DATE;
                if (
                    STORE_LAST_UPDATED_DATE &&
                    !moment(OUT_LAST_UPDATED_DATE).isSame(STORE_LAST_UPDATED_DATE)
                ) {
                    return Promise.reject('该单据已被更新,请刷新');
                }
            }
            const prefix = `update ${tableName} SET `;
            const last = ` LAST_UPDATED_DATE = ${toStoreDate(new Date())}, LAST_UPDATED_BY= ${by} where id = ${project.ID}`;
            delete saveProject.ID;
            let middle = '';
            for (let prop in saveProject) {
                const m = `${prop} = ${saveProject[prop]}`
                middle += m + ',';
            }
            return db.execute(prefix + middle + last).then((res) => {
                if (typeof afterUpdate === 'function') {
                    afterUpdate(project, old);
                }
                return res;
            });
        } else {
            delete saveProject.ID;
            let keys = '',
                values = '';
            for (let prop in saveProject) {
                keys += prop + ',';
                const val = saveProject[prop];
                values += val + ',';
            }
            let id = await db.execute(`select ${tableName}_seq.nextVal from dual`).then(res => res.rows[0].NEXTVAL);
            const sql = `insert into ${tableName} (${keys} ID, CREATION_DATE, CREATED_BY) values (${values}${id},${toStoreDate(new Date())},${by}) `;
            return db.execute(sql).then((res) => {
                if (typeof afterUpdate === 'function') {
                    setTimeout(() => afterUpdate(Object.assign(project, {
                        ID: id
                    })), 0);
                }
                return id;
            });
        }
    }
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
    normalDelete,
    normalUpdate,
    getChangeProp,
    sendMail
}