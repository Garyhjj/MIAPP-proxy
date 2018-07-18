const cac = require('cac'),
    fs = require('fs'),
    path = require('path'),
    db = require('../lib/oracleDB'),
    createTable = require('./createTable');


const cli = cac();

createTable(cli);

cli.on('error', err => {
    console.error('command failed:', err)
    process.exit(1)
});

cli.parse();

// console.log(process.argv)