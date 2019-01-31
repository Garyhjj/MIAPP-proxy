const util = require("../../util"),
    db = require("../../lib/oracleDB"),
    tableUtil = require('../share/util'),
    valueTestAndFormatString = tableUtil.valueTestAndFormatString,
    valueTestAndFormatDate = tableUtil.valueTestAndFormatDate,
    {
        tableColomnType,
        TableFactory
    } = require('../share/tableFactory');

const tableName = 'moa_project_headers',
    beforeUpdate = (p) => {
        if (!p.ID > 0) {
            return db.execute(`select getProjectNo('M') code from dual`).then(res => res.rows[0].CODE).then((c) => {
                p.CODE = c;
                return p;
            })
        } else {
            return p;
        }
    },
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        NAME: tableColomnType.string,
        DESCRIPTION: tableColomnType.string,
        TYPE: tableColomnType.string,
        OWNER: tableColomnType.string,
        STATUS: tableColomnType.string,
        CODE: tableColomnType.string,
        PARENT_HEADER: tableColomnType.string,
        START_DATE: tableColomnType.date,
        DUE_DATE: tableColomnType.date,
        MAIL_SETTING: tableColomnType.number
    }, {
        LastUpdateDate: 'LAST_UPDATED_DATE',
        beforeUpdate
    }),
    update = table.update,
    updateWithLock = table.updateWithLock;

function getItChildren(code) {
    if (typeof code === 'string') {
        return table.search(`select * from moa_project_headers where parent_header = '${code}' and nvl(delete_flag,'N') <> 'Y'`).then(ls => {
            return ls.map(l => {
                let out = {};
                out.title = l;
                out.key = l.CODE;
                out.ID = l.CODE;
                return out;
            })
        });
    } else {
        return null;
    }
}

async function getAllChildrenAndIDList(parent) {
    let childIDList = new Set();
    let children = [];
    const getAllChildren = async (id, out) => {
        const cs = await getItChildren(id);
        if (out) {
            out.children = cs;
            if (!out.children || out.children.length === 0) {
                out.isLeaf = true;
            }
        }
        let req = [];
        if (Array.isArray(cs)) {
            const subC = cs.filter(d => d);
            for (let i = 0, lg = subC.length; i < lg; i++) {
                const cID = subC[i] && subC[i].ID;
                if (childIDList.has(cID)) {
                    continue;
                } else {
                    childIDList.add(cID);
                    req.push(getAllChildren(cID, subC[i]))
                }
            }

        }
        await Promise.all(req);
        return cs;
    }
    children = await getAllChildren(parent);
    return {
        childIDList: Array.from(childIDList),
        children
    }
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
        return table.search(`select h.*,(select count(1) from MOA_PROJECT_LINES where header_id = h.ID and status is not null and NVL(DELETE_FLAG,'N') <> 'Y')
        total_tasks_count, (select count(1) from MOA_PROJECT_LINES where header_id = h.ID and status = 'Closed' and NVL(DELETE_FLAG,'N') <> 'Y') closed_tasks_count,
        (select nvl(sum(WEIGHT),0) from MOA_PROJECT_LINES where header_id = h.ID and status = 'Closed' and NVL(DELETE_FLAG,'N') <> 'Y') finished_pecent 
       from ${tableName} h where NVL(DELETE_FLAG,'N') <> 'Y' 
       and status = NVL(${status},status)
       and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) <= nvl(NVL(${out.endDate},DUE_DATE),to_date('20180101', 'yyyymmdd')) 
       and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) >= nvl(NVL(${out.startDate},DUE_DATE),to_date('20180101', 'yyyymmdd')) 
       and OWNER =NVL(${out.owner},OWNER)`);
    },
    del: table.initDelete(),
    update,
    updateWithLock,
    updateParentHeader: async (project, by, opts) => {
        const parent_code = project.PARENT_HEADER;
        const code = project.CODE;
        if (code === parent_code) {
            return Promise.reject('不能设置自己为父项目');
        }
        const id = project.ID;
        if (parent_code) {
            const target = await table.search(`select 1 from ${tableName} where NVL(DELETE_FLAG,'N') <> 'Y' and code= '${parent_code}'`);
            if (target.length === 0) {
                return Promise.reject('没有此父项目');
            }
            const {
                childIDList
            } = await getAllChildrenAndIDList(code);
            if (childIDList.indexOf(parent_code) > -1) {
                return Promise.reject('不能把自己的子孙项目设为父项目');
            }
            return updateWithLock({
                PARENT_HEADER: parent_code,
                ID: id,
                LAST_UPDATED_DATE: project.LAST_UPDATED_DATE
            }, by, opts);
        } else {
            if (parent_code === '') {
                return updateWithLock({
                    PARENT_HEADER: '',
                    ID: id,
                    LAST_UPDATED_DATE: project.LAST_UPDATED_DATE
                }, by, opts);
            }
            return Promise.reject('无效 PARENT_HEADER');
        }
    },
    searchByMember: ({
        member,
        status,
        startDate,
        endDate,
        owner,
        code,
        type,
        parent
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
                member
            }, out, 'member');
            valueTestAndFormatString({
                owner
            }, out, 'owner');
            valueTestAndFormatString({
                type
            }, out, 'type');
            valueTestAndFormatString({
                code
            }, out, 'code');
            valueTestAndFormatString({
                parent
            }, out, 'parent')
        } catch (e) {
            return Promise.reject(e.message);
        }
        return table.search(`select h.* ,(select count(1) from MOA_PROJECT_LINES where header_id = h.ID and status is not null and NVL(DELETE_FLAG,'N') <> 'Y') total_tasks_count, 
        (select count(1) from MOA_PROJECT_LINES where header_id = h.ID and status = 'Closed' and NVL(DELETE_FLAG,'N') <> 'Y') closed_tasks_count,
        (select nvl(sum(WEIGHT),0) from MOA_PROJECT_LINES where header_id = h.ID and status = 'Closed' and NVL(DELETE_FLAG,'N') <> 'Y') finished_pecent from moa_project_headers h where exists (select header_id from moa_project_people p where p.user_name = ${out.member} and h.ID = p.header_id) 
        and h.owner <> ${out.member} 
        and NVL(DELETE_FLAG,'N') <> 'Y' 
        and status = NVL(${status},status)
        and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) <= nvl(NVL(${out.endDate},DUE_DATE),to_date('20180101', 'yyyymmdd')) 
        and nvl(DUE_DATE,to_date('20180101', 'yyyymmdd')) >= nvl(NVL(${out.startDate},DUE_DATE),to_date('20180101', 'yyyymmdd')) 
        and owner = NVL(${out.owner},owner) 
        and NVL(code,'M') = NVL(NVL(${out.code},code),'M')
        and NVL(type,'t') = NVL(NVL(${out.type},type),'t')
        and (exists (select 1 from moa_project_headers where id = h.parent_header and code=${out.code} )or ${out.code} is null )
        `);
    },
    getItChildren,
    getAllChildrenAndIDList
}