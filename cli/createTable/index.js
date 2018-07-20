const fs = require('fs'),
    path = require('path'),
    db = require('../../lib/oracleDB'),
    template = require('./template');

const dbType = {
    2003: 'tableColomnType.date',
    2002: 'tableColomnType.number',
    2001: 'tableColomnType.string'
}

function formatTableDefine(metaData) {
    const middle = Object.create(null);
    if (Array.isArray(metaData)) {
        metaData.forEach(m => {
            middle[m.name] = dbType[m.fetchType] ? dbType[m.fetchType] : tableColomnType.string
        })
    }
    let tableDefine = ``;
    for (let prop in middle) {
        tableDefine = tableDefine ? tableDefine + ',\r\n' : tableDefine;
        let pre = tableDefine ? '        ' : '';
        tableDefine += `${pre}${prop}: ${middle[prop]}`;
    }
    return tableDefine;
}

function prpareTemplate(template, tableName, tableDefine, subPath) {
    subPath = subPath ? subPath : '';
    let tpl = template;
    if (subPath) {
        let formatSubPath = subPath.replace(/\\/g, '/');
        let pathL = formatSubPath.split('/').filter(s => s);
        if (pathL.length > 0) {
            tpl = template.replace(/\{\{\s*prePath\s*\}\}/, pathL.map(s => '..').join('/') + '/');
        }
    }
    return tpl.replace(/\{\{\s*tableName\s*\}\}/g, tableName.toUpperCase())
        .replace(/\{\{\s*tableDefine\s*\}\}/g, tableDefine);
}

function getFilePath(tableName, subPath) {
    return path.join(process.argv[1], `../tables/${subPath}/${tableName.toLowerCase()}.js`);
}

module.exports = (cli) => {
    const defaultCommand = cli.command('createTable', {
        desc: '新建table模板'
    }, (input, flags) => {
        if (flags.name) {
            const tableName = flags.name;
            console.log('connect with the db');
            db.execute(`select * from ${tableName} where rownum = 1`).then((res) => {
                console.log('getting db result');
                let metaData = res.metaData;
                let out = Object.create(null);
                let tableDefine = formatTableDefine(metaData);
                const subPath = flags.subPath ? flags.subPath : '';
                let tpl = prpareTemplate(template, tableName, tableDefine, tableDefine, subPath);
                const filePath = getFilePath(tableName, subPath);
                fs.exists(filePath, function (e) {
                    if (!e) {
                        console.log('begin to write file');
                        fs.writeFile(filePath, tpl, (err) => {
                            if (err) {
                                console.error('command failed:', err);
                            } else {
                                console.log('Finished:', filePath);
                            }
                        })
                    } else {
                        console.error('command failed:', 'the file has existed');
                    }
                })

            }).catch(err => {
                console.error('command failed:', err)
            });

        }
    });

    defaultCommand.option('name', {
        desc: 'tell me the table name'
    });

    defaultCommand.option('subPath', {
        desc: 'tell me what sub-path you want to put the file'
    });

}