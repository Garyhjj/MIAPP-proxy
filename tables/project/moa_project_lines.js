const util = require("../../util"),
    assert = util.assert,
    moment = require('moment'),
    db = require("../../lib/oracleDB"),
    tableUtil = require('../share/util'),
    toStoreDate = tableUtil.toStoreDate,
    toStoreString = tableUtil.toStoreString,
    valueTestAndFormat = tableUtil.valueTestAndFormat,
    valueTestAndFormatString = tableUtil.valueTestAndFormatString,
    valueTestAndFormatDate = tableUtil.valueTestAndFormatDate,
    valueTestAndFormatNumber = tableUtil.valueTestAndFormatNumber,
    normalDelete = tableUtil.normalDelete,
    normalUpdate = tableUtil.normalUpdate;

const tableName = 'moa_project_lines',
    updateWithLock = util.updateStoreWithLockResolver(tableName, "ID");

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
    valueTestAndFormatString(body, out, 'DESCRIPTION');
    valueTestAndFormatString(body, out, 'TYPE');
    valueTestAndFormatString(body, out, 'STATUS');
    valueTestAndFormatDate(body, out, 'START_DATE');
    valueTestAndFormatDate(body, out, 'DUE_DATE');
    valueTestAndFormatString(body, out, 'MODEL');
    valueTestAndFormatString(body, out, 'BU');
    valueTestAndFormatString(body, out, 'CUSTOMER');
    valueTestAndFormatString(body, out, 'ASSIGNER');
    valueTestAndFormatString(body, out, 'ASSIGNEE');
    valueTestAndFormatString(body, out, 'IMPACT');
    valueTestAndFormatString(body, out, 'ATTACHMENT');
    valueTestAndFormatNumber(body, out, 'WEIGHT');
    assert(Object.keys(out).length > 0, "无有效更新内容");
    return out;
}
module.exports = {
    search: ({
        header_id,
        status,
        assignee,
        id
    }) => {
        header_id = header_id || null;
        status = status ? `'${status}'` : null;
        assignee = assignee ? `'${assignee}'` : `''`;
        id = id > 0 ? id : null;
        if (id) {
            return db.execute(`select * from ${tableName} where ID=NVL(${id},ID)`).then((res) => res.rows);
        }
        return db.execute(`select * from ${tableName} where NVL(DELETE_FLAG,'N') <> 'Y' and header_id = NVL(${header_id},header_id) 
        and status = NVL(${status},status) and NVL(assignee,'na') = NVL(NVL(${assignee},assignee),'na')`).then((res) => res.rows);
    },
    del: normalDelete(tableName, safePass),
    update: normalUpdate(tableName, safePass),
    updateWithLock: (...params) => updateWithLock.update(normalUpdate(tableName, safePass), ...params)
}