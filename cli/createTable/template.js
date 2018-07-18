const t = `const {
    tableColomnType,
    TableFactory
} = require('./{{prePath}}share/tableFactory');

const tableName = {{ tableName }},
    table = new TableFactory(tableName, {
        {{ tableDefine }}
    }),
    update = table.update;


module.exports = {
    search: table.search(),
    del: table.initDelete(),
    update
}
`

module.exports = t;