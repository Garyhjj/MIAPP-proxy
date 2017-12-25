module.exports = {
    info: {
        route: 'ownUndoneReports',
        des: [
            {
                method: 'GET',
                parmas: [
                    {
                        name: 'company_name',
                        type: 'string类型: MSL',
                        canNull: true,
                    },
                    {
                        name: 'type',
                        type: '巡检类别: boss、equip',
                        canNull: true,
                    }
                ],
                results:[{
                    code:200,
                    data: `line_report格式`
                }],
                tip: '根据类别获得需要处理的报告',
                url_example: '?company_name=MSL&type=boss'
            }
        ]
    }
}