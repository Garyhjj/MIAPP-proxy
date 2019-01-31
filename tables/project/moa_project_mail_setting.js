const {
    tableColomnType,
    TableFactory
} = require('../share/tableFactory');

const tableName = 'MOA_PROJECT_MAIL_SETTING',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        TYPE_NAME: tableColomnType.string,
        WILL_TIME_OUT: tableColomnType.number,
        HAS_TIME_OUT: tableColomnType.number,
        DELETE_FLAG: tableColomnType.string,
        CREATION_DATE: tableColomnType.date,
        CREATED_BY: tableColomnType.number,
        LAST_UPDATE_DATE: tableColomnType.date,
        LAST_UPDATED_BY: tableColomnType.number
    }),
    update = table.update;


module.exports = {
    search: table.search.bind(table),
    del: table.initDelete(),
    update
}