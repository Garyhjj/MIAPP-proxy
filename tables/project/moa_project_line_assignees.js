const {
    tableColomnType,
    TableFactory
} = require('../share/tableFactory');

const tableName = 'MOA_PROJECT_LINE_ASSIGNEES',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        LINE_ID: tableColomnType.number,
        USER_NAME: tableColomnType.string,
        CREATION_DATE: tableColomnType.date,
        CREATED_BY: tableColomnType.number,
        LAST_UPDATE_DATE: tableColomnType.date,
        LAST_UPDATED_BY: tableColomnType.number
    }, {
        hasDeleteFlag: false
    }),
    update = table.update;


module.exports = {
    search: table.search.bind(table),
    del: table.initDelete.bind(table),
    update,
    tableName
}