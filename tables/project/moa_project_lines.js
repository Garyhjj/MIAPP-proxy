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
    const attachment = body.ATTACHMENT;
    if (typeof attachment === 'object') {
        body.ATTACHMENT = JSON.stringify(attachment);
    }
    valueTestAndFormatString(body, out, 'DESCRIPTION');
    valueTestAndFormatString(body, out, 'STATUS');
    valueTestAndFormatDate(body, out, 'START_DATE');
    valueTestAndFormatDate(body, out, 'DUE_DATE');
    valueTestAndFormatString(body, out, 'MODEL');
    valueTestAndFormatString(body, out, 'CODE');
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

const beforeUpdate = (p) => {
    if (!p.ID > 0) {
        return db.execute(`select getProjectNo('T') code from dual`).then(res => res.rows[0].CODE).then((c) => {
            p.CODE = c;
            return p;
        })
    } else {
        return p;
    }
}

module.exports = {
    search: ({
        header_id,
        status,
        assignee,
        id,
        owner,
        customer,
        bu,
        code,
        model,
        endDate,
        startDate,
        type
    }) => {
        header_id = header_id || null;
        status = status ? `'${status}'` : null;
        assignee = assignee ? `'${assignee}'` : `''`;
        owner = toStoreString(owner);
        customer = toStoreString(customer);
        bu = toStoreString(bu);
        model = toStoreString(model);
        code = toStoreString(code);
        endDate = toStoreDate(endDate);
        startDate = toStoreDate(startDate);
        type = toStoreString(type);
        id = id > 0 ? id : null;
        if (id) {
            return db.execute(`select * from ${tableName} where ID=NVL(${id},ID)`).then((res) => res.rows);
        }
        return db.execute(`select l.* , (select type from moa_project_headers where ID = l.header_id and NVL(DELETE_FLAG,'N') <> 'Y') type from ${tableName} l where NVL(DELETE_FLAG,'N') <> 'Y' 
        and exists (select 1 from moa_project_headers where ID = l.header_id and NVL(DELETE_FLAG,'N') <> 'Y')
        and header_id = NVL(${header_id},header_id) 
        and status = NVL(${status},status) and NVL(assignee,'na') = NVL(NVL(${assignee},assignee),'na') and (exists (select 1 from moa_project_headers where owner = ${owner} and ID = l.header_id) or ${owner} is null)
        and (customer = NVL(${customer},customer) or ${customer} is null)
        and (bu = NVL(${bu},bu) or ${bu} is null)
        and (code = NVL(${code},code) or ${code} is null)
        and (model = NVL(${model},model) or ${model} is null)
        and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) <= nvl(NVL(${endDate},DUE_DATE),to_date('20180101', 'yyyymmdd')) 
        and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) >= nvl(NVL(${startDate},DUE_DATE),to_date('20180101', 'yyyymmdd'))
        and (exists (select 1 from moa_project_headers where type = ${type} and ID = l.header_id) or ${type} is null)
        `).then((res) => res.rows).then((data) => data.map(d => {
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
    update: normalUpdate(tableName, safePass, {
        beforeUpdate
    }),
    updateWithLock: (...params) => updateWithLock.update(normalUpdate(tableName, safePass, {
        beforeUpdate
    }), ...params)
}