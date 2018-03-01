module.exports = {
    info: {
        route: 'attendanceInfo',
        des: [
            {
                method: 'GET',
                parmas: [
                    {
                        name: 'nameID',
                        type: 'number类型,巡檢種類',
                        canNull: true,
                    },
                    {
                        name: 'dateFM',
                        type: 'string类型,YYYY-MM-DD',
                        canNull: true,
                    },
                    {
                        name: 'dateTO',
                        type: 'string类型,YYYY-MM-DD',
                        canNull: true,
                    },
                    {
                        name: 'type',
                        type: 'number类型: 1未刷卡，2未產生補休，3已產生補休,其它全部',
                        canNull: true,
                    }
                ],
                results:[{
                    code:200,
                    data: `
{
    ACTUAL_HOURS: number
    ACTUAL_TO_TIME: string
    ACUTAL_FROM_TIME: string
    ADDITIONAL_SCORE: number
    ALL_DONE: string
    HEADER_ID: number
    LINE_NUM: number
    NAME: string
    SCHEDULE_DATE: string
    SCHEDULE_HEADER_ID: number
    SCORE: number
}[]`
                }],
                tip: '獲得巡檢人員的出勤信息',
                url_example: '?nameID=3&dateFM=201-01-01&dateTO=2018-01-29&type=1'
            }
        ]
    }
}