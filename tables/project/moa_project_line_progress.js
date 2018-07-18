const {
    tableColomnType,
    TableFactory
} = require('../share/tableFactory');

const tableName = 'moa_project_line_progress',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        HEADER_ID: tableColomnType.number,
        LINE_ID: tableColomnType.number,
        ATTACHMENT: tableColomnType.json,
        CONTENT: tableColomnType.string,
    }, {
        LastUpdateDate: 'LAST_UPDATED_DATE'
    }),
    update = table.update;

module.exports = {
    search: ({
        line_id
    }) => {
        line_id = line_id || null;
        return table.search(`select * from ${tableName} where NVL(DELETE_FLAG,'N') <> 'Y' and line_id = NVL(${line_id},line_id) ORDER BY CREATION_DATE`);
    },
    del: table.initDelete(),
    update,
}