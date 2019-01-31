const {
    tableColomnType,
    TableFactory
} = require('./../share/tableFactory');

const tableName = 'MOA_TAX_SETTING',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        COMPANY_NAME: tableColomnType.string,
        TYPE: tableColomnType.string,
        DESCRIPTION: tableColomnType.string,
        AMOUNT: tableColomnType.number,
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
}