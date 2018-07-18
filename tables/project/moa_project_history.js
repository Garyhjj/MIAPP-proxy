const {
    tableColomnType,
    TableFactory
} = require('../share/tableFactory');

const tableName = 'moa_project_history',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        HEADER_ID: tableColomnType.number,
        TARGET_ID: tableColomnType.number,
        TARGET_TYPE: tableColomnType.number,
        CHANGE_TYPE: tableColomnType.number,
        DIFF: tableColomnType.string,
        BEFORE_STORE: tableColomnType.json,
        AFTER_STORE: tableColomnType.json
    }, {
        LastUpdateDate: 'LAST_UPDATED_DATE'
    }),
    update = table.update;


module.exports = {
    search: ({
        header_id,
        page,
    }) => {
        header_id = header_id || null;
        page = page > 0 ? page : 1;
        const per_count = 5;
        return table.search(`select * from  
        (select t1.*, rownum rn from 
            (select h.*, (select EMPNO from moa_gl_users where ID = h.CREATED_BY) USER_NAME from ${tableName} h where NVL(DELETE_FLAG,'N') <> 'Y' and header_id = NVL(${header_id},header_id) ORDER BY CREATION_DATE DESC) t1 
            where rownum<=${page*per_count})  
      where rn>=${(page-1)*per_count}`)
            .then(data => {
                if (Array.isArray(data)) {
                    data = data.map((d) => {
                        const diff = d.DIFF;
                        d.DIFF = typeof diff === 'string' ? diff.split(',') : diff;
                        return d;
                    })
                }
                return data;
            })
    },
    del: table.initDelete(),
    update
}