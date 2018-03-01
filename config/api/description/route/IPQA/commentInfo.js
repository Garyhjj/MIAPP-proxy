module.exports = {
    info: {
        route: 'commentInfo',
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
                        type: 'number类型: 0代表獲得未評分報告，1已評分，其它獲得全部',
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
                tip: '獲得巡檢報告的評分信息',
                url_example: '?nameID=3&dateFM=201-01-01&dateTO=2018-01-29&type=1'
            }
        ]
    }
}