module.exports = {
    info: {
        route: 'adminTotalTips',
        des: [
            {
                method: 'GET',
                parmas: [
                    {
                        name: 'role',
                        type: 'number类型,1超级管理员,2普通管理员,3普通使用者',
                        canNull: true,
                    },
                    {
                        name: 'type',
                        type: '巡检类别: boss、equip',
                        canNull: true,
                    }
                ],
                tip: '获得对于管理员的提醒数',
                example: '?role=1&type=boss'
            }
        ]
    }
}