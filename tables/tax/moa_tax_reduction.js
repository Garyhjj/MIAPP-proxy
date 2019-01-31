const {
    tableColomnType,
    TableFactory
} = require('./../share/tableFactory'),
    tableUtil = require('../share/util'),
    toStoreString = tableUtil.toStoreString;

const tableName = 'MOA_TAX_REDUCTION',
    table = new TableFactory(tableName, {
        ID: tableColomnType.number,
        COMPANY_NAME: tableColomnType.string,
        TYPE: tableColomnType.string,
        USER_ID: tableColomnType.number,
        YEAR: tableColomnType.string,
        MONTH: tableColomnType.string,
        TEL: tableColomnType.string,
        SPOUSE_ID: tableColomnType.string,
        NAME: tableColomnType.string,
        CERT_ID: tableColomnType.string,
        EDUCATION_TYPE: tableColomnType.string,
        RATE: tableColomnType.string,
        RATE_URL: tableColomnType.string,
        START_DATE: tableColomnType.date,
        END_DATE: tableColomnType.date,
        AMOUNT: tableColomnType.number,
        EXPEND_URL: tableColomnType.string,
        CERTIFICATE_URL: tableColomnType.string,
        PAYMOUNT: tableColomnType.number,
        PROPERTY_NUMBER: tableColomnType.string,
        PURCHASE_CONTRACT_URL: tableColomnType.string,
        FIRST_HOUSE: tableColomnType.string,
        LOAN_CONTRACT_URL: tableColomnType.string,
        NO_HOUSE: tableColomnType.string,
        RENT_CONTRACT_URL: tableColomnType.string,
        RELATIONSHIP: tableColomnType.string,
        ONLY_CHILD: tableColomnType.string,
        SHARE_CONTRACT_URL: tableColomnType.string,
        STATUS: tableColomnType.string,
        SIGNATURE_URL: tableColomnType.string,
        CREATION_DATE: tableColomnType.date,
        CREATED_BY: tableColomnType.number,
        LAST_UPDATE_DATE: tableColomnType.date,
        LAST_UPDATED_BY: tableColomnType.number,
        ILL_LINE_INDEX: tableColomnType.number,
        CERTIFICATE_NO: tableColomnType.string,
        SPOUSE_NAME: tableColomnType.string,
        HAS_DETAIL: tableColomnType.string
    }, {
        hasDeleteFlag: false
    }),
    update = table.update;


module.exports = {
    search: ({
        year,
        month,
        user_id,
        type,
        company_name,
        status
    }) => {
        const types = type ? type.split(',') : [];
        let whereLogic;
        if (types.length > 1) {
            const pre = table.makeWhereLogicString({
                    year,
                    month,
                    user_id,
                    company_name,
                    status
                }),
                typeLogic = `type in (${types.map(_ => `'${_}'`).join(',')})`;
            whereLogic = pre ? pre + 'and ' + typeLogic : typeLogic;
        } else {
            whereLogic = table.makeWhereLogicString({
                year,
                month,
                user_id,
                type,
                company_name,
                status
            });
        }
        return table.search(`select a.*, (select empno from moa_gl_users where id = a.user_id and rownum = 1) EMPNO from ${tableName} a ${whereLogic? `where ${whereLogic}`: ''}`);
    },
    del: ({
        year,
        month,
        user_id,
        type,
        company_name
    }) => {
        const whereLogic = table.makeWhereLogicString({
            year,
            month,
            user_id,
            type,
            company_name
        });
        const sql = `delete  from ${tableName} ${whereLogic? `where ${whereLogic}`: ''}`;
        return table.initDelete(sql)();
    },
    update,
    tableName,
    getLastestReduction(type, user_id, company_name, status = '') {
        const insideLogic = table.makeWhereLogicString({
                type,
                user_id,
                company_name,
                status
            }, false, 'b'),
            outLogic = table.makeWhereLogicString({
                type,
                user_id,
                company_name,
                status
            }, false, 'a');
        const sql = `select * from ${tableName} a where (a.year, a.month) = (select year,month from (select z.*, rownum as n from (select year, month, type, user_id from 
            MOA_TAX_REDUCTION b where b.year is not null and b.month is not null ${insideLogic? `and ${insideLogic}`: ''} order by b.year desc, b.month desc) z) where n = 1)
            ${outLogic? `and ${outLogic}`: ''}`;
        return table.search(sql)
    }
}