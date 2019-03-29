const {
    tableColomnType,
    TableFactory
} = require('./../share/tableFactory');

const tableName = 'MOA_W_CLOTHES_SALES',
    table = new TableFactory(tableName, {
        ID: tableColomnType.string,
        EMPNO: tableColomnType.string,
        C_TYPE: tableColomnType.string,
        C_SIZE: tableColomnType.string,
        HAS_RECEIVED: tableColomnType.string,
        CREATION_DATE: tableColomnType.string,
        CREATED_BY: tableColomnType.string,
        LAST_UPDATE_DATE: tableColomnType.string,
        LAST_UPDATED_BY: tableColomnType.string
    },{
        hasDeleteFlag: false
    }),
    update = table.update;


module.exports = {
    search: table.search.bind(table),
    update,
    tableName
}
