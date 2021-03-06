const db = require("../../lib/oracleDB"),
    tableUtil = require('../share/util'),
    toStoreDate = tableUtil.toStoreDate,
    toStoreString = tableUtil.toStoreString,
    {
        tableColomnType,
        TableFactory
    } = require('../share/tableFactory');

const tableName = 'moa_project_lines',
    beforeUpdate = (p) => {

        if (!p.ID > 0) {
            return db.execute(`select getProjectNo('T') code from dual`).then(res => res.rows[0].CODE).then((c) => {
                p.CODE = c;
                return p;
            })
        } else {
            return p;
        }
    },
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        HEADER_ID: tableColomnType.number,
        WEIGHT: tableColomnType.number,
        ATTACHMENT: tableColomnType.json,
        DESCRIPTION: tableColomnType.string,
        STATUS: tableColomnType.string,
        MODEL: tableColomnType.string,
        BU: tableColomnType.string,
        CUSTOMER: tableColomnType.string,
        CODE: tableColomnType.string,
        ASSIGNER: tableColomnType.string,
        ASSIGNEE: tableColomnType.json,
        IMPACT: tableColomnType.string,
        START_DATE: tableColomnType.date,
        DUE_DATE: tableColomnType.date,
        MAIL_TYPE: tableColomnType.number
    }, {
        LastUpdateDate: 'LAST_UPDATED_DATE',
        beforeUpdate
    }),
    update = table.update,
    updateWithLock = table.updateWithLock;


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
            return table.search(`select * from ${tableName} where ID=NVL(${id},ID)`);
        }
        return table.search(`select l.* ,(select to_char(wm_concat(user_name)) from MOA_PROJECT_LINE_ASSIGNEES where line_ID = l.ID and NVL(DELETE_FLAG,'N') <> 'Y') as assignee_list,
        (select type from moa_project_headers where ID = l.header_id and NVL(DELETE_FLAG,'N') <> 'Y') type from ${tableName} l where NVL(DELETE_FLAG,'N') <> 'Y' 
        and exists (select 1 from moa_project_headers where ID = l.header_id and NVL(DELETE_FLAG,'N') <> 'Y')
        and header_id = NVL(${header_id},header_id) 
        and status = NVL(${status},status) and (${assignee} is null or exists (select 1 from MOA_PROJECT_LINE_ASSIGNEES where user_name = ${assignee} and line_id = l.ID))
        and (exists (select 1 from moa_project_headers where owner = ${owner} and ID = l.header_id) or ${owner} is null)
        and (customer = NVL(${customer},customer) or ${customer} is null)
        and (bu = NVL(${bu},bu) or ${bu} is null)
        and (code = NVL(${code},code) or ${code} is null)
        and (model = NVL(${model},model) or ${model} is null)
        and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) <= nvl(NVL(${endDate},DUE_DATE),to_date('20180101', 'yyyymmdd')) 
        and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) >= nvl(NVL(${startDate},DUE_DATE),to_date('20180101', 'yyyymmdd'))
        and (exists (select 1 from moa_project_headers where type = ${type} and ID = l.header_id) or ${type} is null)
        `).then((ls) => ls.map(l => {
            l.ASSIGNEE_LIST = l.ASSIGNEE_LIST || '';
            l.ASSIGNEE_LIST = l.ASSIGNEE_LIST.split(',').filter(_ => !!_);
            return l;
        }));
    },
    del: table.initDelete(),
    update,
    updateWithLock
}