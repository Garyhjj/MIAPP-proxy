const {
    tableColomnType,
    TableFactory
} = require('../share/tableFactory');

const tableName = 'moa_project_line_comments',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        HEADER_ID: tableColomnType.number,
        LINE_ID: tableColomnType.number,
        USER_NAME: tableColomnType.string,
        CONTENT: tableColomnType.string,
        REPLY_TO: tableColomnType.string,
    }, {
        LastUpdateDate: 'LAST_UPDATED_DATE'
    }),
    update = table.update;

module.exports = {
    search: ({
        line_id
    }) => {
        line_id = line_id || null;
        return table.search(`select * from ${tableName} where NVL(DELETE_FLAG,'N') <> 'Y' and line_id = NVL(${line_id},line_id) ORDER BY CREATION_DATE DESC`);
    },
    del: table.initDelete(),
    update,
}