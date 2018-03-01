

module.exports = {
    info:{
        prefix: 'IPQA',
        routes:[
            require('./adminTotalTips'),
            require('./ownUndoneReports'),
            require('./excIPQAReports'),
            require('./tracProblems'),
            require('./commentInfo'),
            require('./attendanceInfo')
        ]
    }
}