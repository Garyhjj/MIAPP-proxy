const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;
const config = require('../config/base'),
    sqlSafe = require('../util').sqlSafe;
let dbConfig;
if (process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'production') {
    dbConfig = config.productionDB;
} else {
    dbConfig = config.devDB;
}


async function getConnection() {
    return await oracledb.getConnection({
        user: dbConfig.user,
        password: dbConfig.password,
        connectString: dbConfig.connectString
    });
}

async function release(conn) {
    try {
        await conn.release();
    } catch (e) {
        console.error(e);
    }
}

function execute(sql) {
    let conn, succRes, errMes;
    return oracledb.getConnection({
        user: dbConfig.user,
        password: dbConfig.password,
        connectString: dbConfig.connectString
    }).then((c) => {
        conn = c;
        return conn.execute(sqlSafe(sql), [], {
            autoCommit: true
        })
    }).then((res) => {
        succRes = res;
        return conn.release();
    }, ).catch(err => {
        errMes = err;
        return conn.release();
    }).then((_) => {
        if (errMes) {
            const errM = typeof errMes === 'string' ? errMes : errMes.stack;
            throw new Error(errM);
        } else {
            return succRes;
        }
    });
}



module.exports = {
    getConnection,
    release,
    execute
}