const {
    tableColomnType,
    TableFactory
} = require('./../share/tableFactory');

const tableName = 'MOA_END_MONITORS',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        MONITOR_DATE: tableColomnType.date,
        MONITOR_BODY: tableColomnType.json,
        CREATION_DATE: tableColomnType.date,
        CREATED_BY: tableColomnType.number,
        LAST_UPDATE_DATE: tableColomnType.date,
        LAST_UPDATED_BY: tableColomnType.number,
        MORE_ROUTES1: tableColomnType.json,
        MORE_ROUTES2: tableColomnType.json,
        MORE_ROUTES3: tableColomnType.json
    }, {
        hasDeleteFlag: false
    }),
    update = table.update;


module.exports = {
    search: table.search.bind(table),
    del: table.initDelete(),
    update
}