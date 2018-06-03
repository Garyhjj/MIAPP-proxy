const util = require("../../util"),
    assert = util.assert,
    moment = require('moment'),
    db = require("../../lib/oracleDB"),
    tableUtil = require('../share/util'),
    valueTestAndFormatString = tableUtil.valueTestAndFormatString,
    normalDelete = tableUtil.normalDelete,
    normalUpdate = tableUtil.normalUpdate;

const tableName = 'moa_project_people';

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
    valueTestAndFormatString(body, out, 'USER_NAME');
    assert(Object.keys(out).length > 0, "无有效更新内容");
    return out;
}
module.exports = {
    search: ({
        header_id
    }) => {
        header_id = header_id || null;
        return db.execute(`select * from ${tableName} where DELETE_FLAG <> 'Y' or DELETE_FLAG is null and header_id = NVL(${header_id},header_id)`).then((res) => res.rows)
    },
    del: normalDelete(tableName, safePass),
    update: normalUpdate(tableName, safePass),
}