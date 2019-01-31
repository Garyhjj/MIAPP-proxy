const {
    tableColomnType,
    TableFactory
} = require('./../share/tableFactory');

const tableName = 'MOA_LOG_TABLE',
    table = new TableFactory(tableName, {
        STATUS_CODE: tableColomnType.string,
        BODY: tableColomnType.json,
        MOBILE_FLAG: tableColomnType.string,
        EQUIP_NAME: tableColomnType.string,
        CREATION_DATE: tableColomnType.date,
        CREATED_BY: tableColomnType.number
    }),
    update = table.update;


module.exports = {
    search: table.search.bind(table),
    del: table.initDelete(),
    update
}