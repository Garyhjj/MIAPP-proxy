const {
    tableColomnType,
    TableFactory
} = require('../share/tableFactory');

const tableName = 'moa_project_people',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        HEADER_ID: tableColomnType.number,
        USER_NAME: tableColomnType.string
    }, {
        LastUpdateDate: 'LAST_UPDATED_DATE'
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