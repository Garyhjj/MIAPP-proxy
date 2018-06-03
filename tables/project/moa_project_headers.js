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
    normalDelete = tableUtil.normalDelete,
    normalUpdate = tableUtil.normalUpdate;

const tableName = 'moa_project_headers',
    updateWithLock = util.updateStoreWithLockResolver(tableName, "ID"),
    keys = ['ID', 'NAME',
        'TYPE',
        'DESCRIPTION',
        'OWNER',
        'START_DATE',
        'DUE_DATE',
        'STATUS',
        'FINISHED_PECENT',
        'DELETE_FLAG',
        'CREATION_DATE',
        'CREATED_BY',
        'LAST_UPDATE_DATE',
        'LAST_UPDATED_BY'
    ]

function safePass(body) {
    let out = {};
    if (body.hasOwnProperty('ID')) {
        assert(typeof + body.ID === "number", "ID 必须为数字类型");
        out.ID = +body.ID;
    }
    valueTestAndFormatString(body, out, 'NAME');
    valueTestAndFormatString(body, out, 'DESCRIPTION');
    valueTestAndFormatString(body, out, 'TYPE');
    valueTestAndFormatString(body, out, 'OWNER');
    valueTestAndFormatString(body, out, 'STATUS');
    valueTestAndFormatDate(body, out, 'START_DATE');
    valueTestAndFormatDate(body, out, 'DUE_DATE');
    assert(Object.keys(out).length > 0, "无有效更新内容");
    return out;
}
module.exports = {
    search: ({
        status,
        startDate,
        endDate,
        owner
    }) => {
        status = status ? `'${status}'` : null;
        let out = {};
        try {
            valueTestAndFormatDate({
                startDate
            }, out, 'startDate');
            valueTestAndFormatDate({
                endDate
            }, out, 'endDate');
            valueTestAndFormatString({
                owner
            }, out, 'owner');
        } catch (e) {
            return Promise.reject(e.message);
        }
        return db.execute(`select h.*,(select count(1) from MOA_PROJECT_LINES where header_id = h.ID and status is not null) total_tasks_count, (select count(1) from MOA_PROJECT_LINES where header_id = h.ID and status = 'Closed') closed_tasks_count,(select nvl(sum(WEIGHT),0) from MOA_PROJECT_LINES where header_id = h.ID and status = 'Closed') finished_pecent 
        from ${tableName} h where DELETE_FLAG <> 'Y' or DELETE_FLAG is null 
        and status = NVL(${status},status)
        and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) <= nvl(NVL('',DUE_DATE),to_date('20180101', 'yyyymmdd')) 
        and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) >= nvl(NVL('',DUE_DATE),to_date('20180101', 'yyyymmdd')) 
        and OWNER =NVL(${out.owner},OWNER)`).then((res) => res.rows);
    },
    del: normalDelete(tableName, safePass),
    update: normalUpdate(tableName, safePass),
    updateWithLock: (...params) => updateWithLock.update(normalUpdate(tableName, safePass), ...params)
}