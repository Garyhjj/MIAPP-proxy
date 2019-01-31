const db = require("../../lib/oracleDB"),
    tableUtil = require('../../tables/share/util');


const tableName = 'ONT.MOE_SHIPPING_KANBAN@micerp';

module.exports = {
    tableName,
    search: ({
        deptno,
        ofder
    }) => {
        deptno = tableUtil.toStoreString(deptno);
        ofder = tableUtil.toStoreString(ofder);
        return db.execute(`select * from ${tableName} where 
        (${deptno} is null or DEPT_SHORTNAME = NVL(${deptno}, DEPT_SHORTNAME))
        and (${ofder} is null or OFDER = NVL(${ofder}, OFDER))
        and WEEK_START_DATE = trunc(sysdate+1,'d') -1 
        order by DEPT_SHORTNAME`).then((res) => res.rows);
    },
    getDeptShortNameList() {
        return db.execute(`select distinct(dept_shortname) from ${tableName}`).then((res) => res.rows);
    }
}