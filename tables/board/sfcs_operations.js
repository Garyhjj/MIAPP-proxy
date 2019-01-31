const {
    tableColomnType,
    TableFactory
} = require('./../share/tableFactory');

const tableName = 'SFCS_OPERATIONS@DBLINK_MISFCS_SFCS',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        VERSION: tableColomnType.number,
        ENABLE_BILL_ID: tableColomnType.string,
        DISABLE_BILL_ID: tableColomnType.string,
        OPERATION_NAME: tableColomnType.string,
        OPERATION_CLASS: tableColomnType.number,
        OPERATION_CATEGORY: tableColomnType.number,
        DESCRIPTION: tableColomnType.string,
        ENABLED: tableColomnType.string,
        ATTRIBUTE1: tableColomnType.string,
        ATTRIBUTE2: tableColomnType.string,
        ATTRIBUTE3: tableColomnType.string,
        ATTRIBUTE4: tableColomnType.string,
        ATTRIBUTE5: tableColomnType.string,
        AUTO_LINK: tableColomnType.string
    }),
    update = table.update;


module.exports = {
    tableName,
    search: () => {
        return table.search(`SELECT ID OP_ID, OPERATION_NAME OP_NAME
        FROM ${tableName}
       WHERE ENABLED = 'Y' AND OPERATION_CLASS = 1`);
    }
}