const util = require("../../util"),
    assert = util.assert,
    moment = require('moment'),
    db = require("../../lib/oracleDB"),
    tableUtil = require('../share/util'),
    valueTestAndFormatString = tableUtil.valueTestAndFormatString,
    normalDelete = tableUtil.normalDelete,
    normalUpdate = tableUtil.normalUpdate;

const tableName = 'moa_project_line_progress';

function safePass(body) {
    let out = {}
    if (body.hasOwnProperty('ID')) {
        assert(typeof + body.ID === "number", "ID 必须为数字类型");
        out.ID = +body.ID;
    }
    if (body.hasOwnProperty('LINE_ID')) {
        assert(typeof + body.LINE_ID === "number", "LINE_ID 必须为数字类型");
        out.LINE_ID = +body.LINE_ID;
    }
    if (body.hasOwnProperty('HEADER_ID')) {
        assert(typeof + body.HEADER_ID === "number", "HEADER_ID 必须为数字类型");
        out.HEADER_ID = +body.HEADER_ID;
    }
    const attachment = body.ATTACHMENT;
    if (typeof attachment === 'object') {
        body.ATTACHMENT = JSON.stringify(attachment);
    }
    valueTestAndFormatString(body, out, 'CONTENT');
    valueTestAndFormatString(body, out, 'ATTACHMENT');
    assert(Object.keys(out).length > 0, "无有效更新内容");
    return out;
}
module.exports = {
    search: ({
        line_id
    }) => {
        line_id = line_id || null;
        return db.execute(`select * from ${tableName} where NVL(DELETE_FLAG,'N') <> 'Y' and line_id = NVL(${line_id},line_id) ORDER BY CREATION_DATE`).then((res) => res.rows).then((data) => data.map(d => {
            if (d.ATTACHMENT) {
                try {
                    d.ATTACHMENT = JSON.parse(d.ATTACHMENT);
                } catch (e) {

                }
            }
            return d;
        }));
    },
    del: normalDelete(tableName, safePass),
    update: normalUpdate(tableName, safePass),
}