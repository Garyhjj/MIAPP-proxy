const moment = require('moment'),
    util = require("../../util"),
    assert = util.assert,
    isString = util.isString,
    db = require("../../lib/oracleDB"),
    tableUtil = require('./util'),
    valueTestAndFormatString = tableUtil.valueTestAndFormatString,
    valueTestAndFormatNumber = tableUtil.valueTestAndFormatNumber,
    valueTestAndFormatJSON = tableUtil.valueTestAndFormatJSON,
    valueTestAndFormatDate = tableUtil.valueTestAndFormatDate,
    toStoreDate = tableUtil.toStoreDate;

const tableColomnType = {
    string: 1,
    number: 2,
    json: 3,
    date: 4,
    dateWithFormat(format) {
        return {
            type: tableColomnType.json,
            format
        }
    }
}

const defaultProperties = {
    primaryKey: 'ID',
    creationDate: 'CREATION_DATE',
    createdBy: 'CREATED_BY',
    LastUpdateDate: 'LAST_UPDATE_DATE',
    lastUpdatedBy: 'LAST_UPDATED_BY',
    deleteFlag: 'DELETE_FLAG',
    hasDeleteFlag: true,
    isLocked: true,
    seq: '{tableName}_SEQ'
}

class TableFactory {

    constructor(tableName, tableColomnDefine, properties) {
        assert(typeof tableName === 'string' && tableName, `${tableName} 必须是string类型`);
        this.tableName = tableName;
        this.properties = typeof properties === 'object' ? Object.assign({}, defaultProperties, properties) : defaultProperties;
        if (typeof tableColomnDefine === 'object' && tableColomnDefine) {
            this.tableColomnDefine = tableColomnDefine;
            this._initSafePass();
        } else {
            return null;
        }
    }
    get update() {
        return this._update.bind(this);
    }

    get updateWithLock() {
        return this._updateWithLock.bind(this);
    }

    _initSafePass() {
        let tableColomnDefine = this.tableColomnDefine;
        this.safePass = (target, notUpdate) => {
            let out = {};
            for (let prop in tableColomnDefine) {
                let type = tableColomnDefine[prop];
                if (type === tableColomnType.string) {
                    valueTestAndFormatString(target, out, prop);
                } else if (type === tableColomnType.number) {
                    valueTestAndFormatNumber(target, out, prop);
                } else if (type === tableColomnType.json) {
                    valueTestAndFormatJSON(target, out, prop);
                } else if (type === tableColomnType.date) {
                    valueTestAndFormatDate(target, out, prop);
                } else if (typeof type === 'object') {
                    if (type.type === tableColomnType.date) {
                        valueTestAndFormatDate(target, out, prop, type.format);
                    }
                }
            }
            if (!notUpdate) {
                assert(Object.keys(out).length > 0, "无有效更新内容");
            }
            return out;
        }
    }
    search(sql) {
        const jsonTypeList = [],
            tableColomnDefine = this.tableColomnDefine;
        for (let prop in this.tableColomnDefine) {
            let type = tableColomnDefine[prop];
            if (type === tableColomnType.json) {
                jsonTypeList.push(prop);
            }
        }
        if (!(isString(sql) && sql)) {
            const tableName = this.tableName;
            if (this.properties.hasDeleteFlag) {
                sql = `select * from ${tableName} where NVL(${this.properties.deleteFlag},'N') <> 'Y'`
            } else {
                sql = `select * from ${tableName}`;
            }
        }
        return db.execute(sql).then((res) => res.rows).then(ls => {
            if (Array.isArray(jsonTypeList) && jsonTypeList.length > 0) {
                return ls.map(l => {
                    jsonTypeList.forEach(j => {
                        try {
                            l[j] = JSON.parse(l[j])
                        } catch (e) {
                            console.error(e, l[j])
                        }
                    });
                    return l;
                })
            }
            return ls;
        });
    }

    makeWhereLogicString(params, notNull, prefix) {
        if (typeof params === 'object') {
            let out = '';
            params = Object.assign({}, params);
            for (let prop in params) {
                if (params.hasOwnProperty(prop)) {
                    params[prop.toLocaleUpperCase()] = params[prop];
                }
            }
            params = this.safePass(params, true);
            prefix = prefix || '';
            for (let prop in params) {
                if (params.hasOwnProperty(prop)) {
                    const val = params[prop],
                        one = `(${notNull?'': `${val} is null or `}${prefix? prefix+'.':''}${prop} = ${val})`;
                    out = out ? `${out} and ${one}` : one;
                }
            }
            return out;
        } else {
            return '';
        }
    }
    initDelete(sql) {
        return (id, by) => {
            if (!(isString(sql) && sql)) {
                const tableName = this.tableName;
                const properties = this.properties;
                const primaryKey = properties.primaryKey;
                let _sql = '';
                if (this.properties.hasDeleteFlag) {
                    _sql = `update ${tableName} SET ${properties.deleteFlag} =  'Y', ${properties.LastUpdateDate} = ${toStoreDate()}, ${properties.lastUpdatedBy}= ${by} 
                    where ${primaryKey} = ${this.safePass({[primaryKey]: id})[primaryKey]}`
                } else {
                    _sql = `delete from ${tableName} where ${primaryKey} = ${this.safePass({[primaryKey]: id})[primaryKey]}`;
                }
                return db.execute(_sql);
            }
            return db.execute(sql);
        }
    }
    async _update(target, by, opts) {
        let safePass = this.safePass,
            tableName = this.tableName,
            properties = this.properties;
        by = by || -1;
        const outBeforeUpdate = properties.beforeUpdate;
        if (typeof outBeforeUpdate === 'function') {
            const res = outBeforeUpdate(target, by);
            if (res instanceof Promise) {
                let err;
                let pRes = await res.catch(e => {
                    err = e
                });
                if (err) {
                    return Promise.reject(err);
                }
                if (typeof pRes === 'object') {
                    target = pRes;
                }
            } else if (typeof res === 'object') {
                target = res;
            }
        }
        let saveProject;
        if (typeof safePass === 'function') {
            try {
                saveProject = safePass(Object.assign({}, target));
            } catch (e) {
                return Promise.reject(e.message);
            }
        } else {
            saveProject = target;
        }
        const afterUpdate = opts && opts.afterUpdate,
            primaryKey = properties.primaryKey,
            primaryKeyVal = saveProject[primaryKey];
        delete saveProject[properties.deleteFlag];
        if (primaryKeyVal > 0) {
            const old = await db.execute(`select * from ${tableName} where ${primaryKey} = ${primaryKeyVal}`).then(res => {
                if (Array.isArray(res.rows) && res.rows.length > 0) {
                    return res.rows[0];
                }
            });
            const lastUpdateDateKey = properties.LastUpdateDate,
                lastUpdatedByKey = properties.lastUpdatedBy;
            if (old) {
                const OUT_LAST_UPDATED_DATE = target[lastUpdateDateKey];
                const STORE_LAST_UPDATED_DATE = old[lastUpdateDateKey];
                if (
                    OUT_LAST_UPDATED_DATE && STORE_LAST_UPDATED_DATE &&
                    !moment(OUT_LAST_UPDATED_DATE).isSame(STORE_LAST_UPDATED_DATE)
                ) {
                    return Promise.reject('该单据已被更新,请刷新');
                }
            }
            const prefix = `update ${tableName} SET `;
            const last = ` ${lastUpdateDateKey} = ${toStoreDate(new Date())}, ${lastUpdatedByKey}= ${by} where ${primaryKey} = ${primaryKeyVal}`;
            delete saveProject[primaryKey];
            delete saveProject[lastUpdatedByKey];
            delete saveProject[lastUpdateDateKey];
            let middle = '';
            for (let prop in saveProject) {
                const m = `${prop} = ${saveProject[prop]}`
                middle += m + ',';
            }
            return db.execute(prefix + middle + last).then((res) => {
                if (typeof afterUpdate === 'function') {
                    afterUpdate(target, old);
                }
                return res;
            });
        } else {
            const creationDateKey = properties.creationDate,
                createdByKey = properties.createdBy;
            delete saveProject[createdByKey];
            delete saveProject[creationDateKey];
            delete saveProject[primaryKey];
            let keys = '',
                values = '';
            for (let prop in saveProject) {
                keys += prop + ',';
                const val = saveProject[prop];
                values += val + ',';
            }
            const seq = util.replaceQuery(properties.seq, {
                tableName: this.tableName
            });
            let id = await db.execute(`select ${seq}.nextVal from dual`).then(res => res.rows[0].NEXTVAL);
            const sql = `insert into ${tableName} (${keys} ${primaryKey}, ${creationDateKey}, ${createdByKey}) values (${values}${id},${toStoreDate(new Date())},${by}) `;
            return db.execute(sql).then((res) => {
                if (typeof afterUpdate === 'function') {
                    const r1 = afterUpdate(Object.assign(target, {
                        ID: id
                    }));
                    if (r1 instanceof Promise) {
                        return r1.then(() => id);
                    }
                }
                return id;
            });
        }
    }
    _updateWithLock(target, by, opts) {
        const updateWithLock = util.updateStoreWithLockResolver(this.tableName, this.properties.primaryKey);
        return updateWithLock.update((target, by, opts) => this.update(target, by, opts), target, by, opts)
    }
}

module.exports = {
    TableFactory,
    tableColomnType
}