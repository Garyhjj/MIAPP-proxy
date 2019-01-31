const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;
const config = require('../config/base');
// let dbConfig;
// if (process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'production') {
//     dbConfig = config.productionDB;
// } else {
//     dbConfig = config.devDB;
// }

class Connection {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this._executingCount = 0;
        this.connection = null;
        this.freeCheckTimeId = null;
        this.promiseCache = null;
    }

    get executingCount() {
        return this._executingCount;
    }
    async connect() {
        if (!this.promiseCache) {
            this.promiseCache = oracledb.getConnection(this.dbConfig)
        }
        return this.promiseCache;
    }

    async release() {
        if (this.connection) {
            const con = this.connection;
            this.connection = null;
            this.promiseCache = null;
            this._executingCount = 0;
            return con.release();
        }
    }

    async execute(
        sql,
        params = [],
        options = {
            autoCommit: true,
            outFormat: oracledb.OBJECT,
        },
    ) {
        this._executingCount++;
        if (!this.connection) {
            await this.connect()
                .then(con => {
                    this.connection = con;
                })
                .catch(err => {
                    this.finishOneSql();
                    return Promise.reject(err);
                });
        } else {
            this.promiseCache = null;
        }
        const connection = this.connection;
        this.clearFreeCheckTimeout();
        return await connection
            .execute(sql, params, options)
            .then(res => {
                this.finishOneSql();
                return res;
            })
            .catch(err => {
                this.finishOneSql();
                this.release();
                return Promise.reject(err);
            });
    }

    finishOneSql() {
        this._executingCount = Math.max(0, this._executingCount - 1);
        this.doFreeCheck();
    }

    doFreeCheck() {
        if (this._executingCount === 0) {
            this.freeCheckTimeId = setTimeout(() => {
                this.freeCheckTimeId = null;
                this.release();
            }, 30 * 1000);
        } else {
            this.clearFreeCheckTimeout();
        }
    }

    clearFreeCheckTimeout() {
        if (this.freeCheckTimeId) {
            clearTimeout(this.freeCheckTimeId);
            this.freeCheckTimeId = null;
        }
    }
}

class ConnectionController {

    constructor(dbConfig) {
        this.connections = [];
        this.maxConnections = 20;
        this.maxOneExecutingCount = 3;
        this.dbConfig = dbConfig;
    }

    initConnection() {
        return new Connection(this.dbConfig);
    }

    getConnection() {
        const connections = this.connections;
        const lg = this.connections.length;
        if (lg === 0) {
            const con = this.initConnection();
            connections.push(con);
            return con;
        } else {
            connections.sort((a, b) => a.executingCount - b.executingCount);
            // console.log(connections.map(_ => _.executingCount));
            let tarCon;
            for (let i = lg - 1; i > -1; i--) {
                const c = connections[i];
                if (c.executingCount < this.maxOneExecutingCount) {
                    tarCon = c;
                    break;
                }
            }
            tarCon = tarCon || connections[0];
            if (
                tarCon.executingCount >= this.maxOneExecutingCount &&
                lg < this.maxConnections
            ) {
                const con = this.initConnection();
                connections.push(con);
                return con;
            } else {
                return tarCon;
            }
        }
    }

    async execute(
        sql,
        isBlock,
        params = [],
        options = {
            autoCommit: true,
            outFormat: oracledb.OBJECT,
        },
    ) {
        const con = this.getConnection();
        return con.execute(sql, params, options);
    }
}


class DatabaseService {
    constructor() {
        this.dbConfig = null;
        this.oaDb = null;
        this.getDatabaseConfig();
        this.initDb();
    }

    getDatabaseConfig() {
        if (process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'production') {
            this.dbConfig = config.productionDB;
        } else {
            this.dbConfig = config.devDB;
        }
    }

    initDb() {
        this.oaDb = this.oaDb || new ConnectionController(this.dbConfig);
    }

    sqlSafe(s) {
        if (typeof s === 'string') {
            return s.replace(/\;/g, "；");
        }
        throw new Error('not sql');
    }

    execute(
        sql,
        isBlock,
        params = [],
        options = {
            autoCommit: true,
            outFormat: oracledb.OBJECT,
        },
    ) {
        sql = isBlock ? sql : this.sqlSafe(sql);
        return this.oaDb.execute(sql, isBlock, params, options)
    }

    async search(sql) {
        return this.execute(sql, false, undefined, undefined).then(
            r => r.rows,
        );
    }
}

// const sqlSafe = (s) => {
//     if (typeof s === 'string') {
//         return s.replace(/\;/g, "；");
//     }
//     throw new Error('not sql');
// };
// async function getConnection() {
//     return await oracledb.getConnection({
//         user: dbConfig.user,
//         password: dbConfig.password,
//         connectString: dbConfig.connectString
//     });
// }

// async function release(conn) {
//     try {
//         await conn.release();
//     } catch (e) {
//         console.error(e);
//     }
// }

// function execute(sql, isBlock) {
//     let conn, succRes, errMes;
//     return oracledb.getConnection({
//         user: dbConfig.user,
//         password: dbConfig.password,
//         connectString: dbConfig.connectString
//     }).then((c) => {
//         conn = c;
//         return conn.execute(isBlock ? sql : sqlSafe(sql), [], {
//             autoCommit: true,
//             extendedMetaData: true
//         })
//     }).then((res) => {
//         succRes = res;
//         return conn.release();
//     }, ).catch(err => {
//         errMes = err;
//         return conn.release();
//     }).then((_) => {
//         if (errMes) {
//             const errM = typeof errMes === 'string' ? errMes : errMes.stack;
//             throw new Error(errM);
//         } else {
//             return succRes;
//         }
//     });
// }



module.exports = new DatabaseService()