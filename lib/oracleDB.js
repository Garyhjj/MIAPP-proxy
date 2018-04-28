const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;
const config = require('../config/base');

let dbConfig ;
if (process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'production'){
    dbConfig=config.productionDB;
}else{
    dbConfig=config.devDB;
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

async function execute(sql) {
    let conn;
    try {
        conn = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        });
        return await conn.execute(sql, [], { autoCommit: true });
    }
    catch (err) {
        console.log(err);
        if (conn) {
            await release(conn);
        }
    } finally {
        if (conn) {
            await release(conn);
        }
    }
}



module.exports = {
    getConnection,
    release,
    execute
}

