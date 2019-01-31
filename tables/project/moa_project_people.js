const {
    tableColomnType,
    TableFactory
} = require('../share/tableFactory'), {
    toStoreString
} = require('../share/util');

const tableName = 'moa_project_people',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        HEADER_ID: tableColomnType.number,
        USER_NAME: tableColomnType.string
    }, {
        LastUpdateDate: 'LAST_UPDATED_DATE',
        beforeUpdate: async (target) => {
            let res = await table.search(`select * from ${tableName} where HEADER_ID=${target.HEADER_ID} and USER_NAME = ${toStoreString(target.USER_NAME)} and NVL(DELETE_FLAG,'N') <> 'Y'`);
            if (res.length > 0) {
                return Promise.reject('不要添加重复的组员');
            }
        }
    }),
    update = table.update;

module.exports = {
    search: ({
        header_id,
        id
    }) => {
        header_id = header_id || null;
        id = id > 0 ? id : null;
        if (id) {
            return table.search(`select * from ${tableName} where ID=NVL(${id},ID)`);
        }
        return table.search(`select * from ${tableName} where NVL(DELETE_FLAG,'N') <> 'Y' and header_id = NVL(${header_id},header_id)`);
    },
    del: table.initDelete(),
    update,
}