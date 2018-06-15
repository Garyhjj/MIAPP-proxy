const util = require("../../util"),
    assert = util.assert,
    moment = require('moment'),
    db = require("../../lib/oracleDB"),
    tableUtil = require('../share/util'),
    valueTestAndFormatString = tableUtil.valueTestAndFormatString,
    valueTestAndFormatNumber = tableUtil.valueTestAndFormatNumber,
    normalDelete = tableUtil.normalDelete,
    normalUpdate = tableUtil.normalUpdate;

const tableName = 'moa_project_history';

function safePass(body) {
    let out = {}
    if (body.hasOwnProperty('ID')) {
        assert(typeof + body.ID === "number", "ID 必须为数字类型");
        out.ID = +body.ID;
    }
    if (body.hasOwnProperty('HEADER_ID')) {
        assert(typeof + body.HEADER_ID === "number", "HEADER_ID 必须为数字类型");
        out.HEADER_ID = +body.HEADER_ID;
    }
    valueTestAndFormatNumber(body, out, 'TARGET_ID');
    valueTestAndFormatNumber(body, out, 'TARGET_TYPE');
    valueTestAndFormatString(body, out, 'DIFF');
    valueTestAndFormatNumber(body, out, 'CHANGE_TYPE');
    valueTestAndFormatString(body, out, 'BEFORE_STORE');
    valueTestAndFormatString(body, out, 'AFTER_STORE');
    assert(Object.keys(out).length > 0, "无有效更新内容");
    return out;
}
module.exports = {
    search: ({
        header_id,
        page,
    }) => {
        header_id = header_id || null;
        page = page > 0 ? page : 1;
        const per_count = 5;
        return db.execute(`select * from  
        (select t1.*, rownum rn from 
            (select h.*, (select EMPNO from moa_gl_users where ID = h.CREATED_BY) USER_NAME from ${tableName} h where NVL(DELETE_FLAG,'N') <> 'Y' and header_id = NVL(${header_id},header_id) ORDER BY CREATION_DATE DESC) t1 
            where rownum<=${page*per_count})  
      where rn>=${(page-1)*per_count}`).then((res) => res.rows)
            .then(data => {
                if (Array.isArray(data)) {
                    data = data.map((d) => {
                        const diff = d.DIFF;
                        d.DIFF = typeof diff === 'string' ? diff.split(',') : diff;
                        const tryJsonParse = (name) => {
                            const s = d[name];
                            if (typeof s === 'string') {
                                let out = s;
                                try {
                                    out = JSON.parse(s);
                                } catch (e) {

                                }
                                d[name] = out;
                            }
                        }
                        tryJsonParse('BEFORE_STORE');
                        tryJsonParse('AFTER_STORE');
                        return d;
                    })
                }
                return data;
            })
    },
    del: normalDelete(tableName, safePass),
    update: normalUpdate(tableName, safePass),
}