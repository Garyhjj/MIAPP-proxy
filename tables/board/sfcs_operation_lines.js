const {
    tableColomnType,
    TableFactory
} = require('./../share/tableFactory');

const tableName = 'SFCS_OPERATION_LINES@DBLINK_MISFCS_SFCS',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        VERSION: tableColomnType.number,
        ENABLE_BILL_ID: tableColomnType.string,
        DISABLE_BILL_ID: tableColomnType.string,
        OPERATION_LINE_NAME: tableColomnType.string,
        LINE_TYPE: tableColomnType.string,
        PHYSICAL_LOCATION: tableColomnType.number,
        LINE: tableColomnType.string,
        PLANT_CODE: tableColomnType.number,
        ENABLED: tableColomnType.string,
        SUBINVENTORY_ID: tableColomnType.number,
        ATTRIBUTE2: tableColomnType.string,
        ATTRIBUTE3: tableColomnType.string,
        ATTRIBUTE4: tableColomnType.string,
        ATTRIBUTE5: tableColomnType.string
    }),
    update = table.update;


module.exports = {
    tableName,
    search: () => {
        return table.search(`SELECT ID LINE_ID, OPERATION_LINE_NAME LINE_NAME
        FROM ${tableName}
       WHERE ENABLED = 'Y'`);
    },
}