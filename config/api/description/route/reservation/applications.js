module.exports = {
    info:{
        route: 'applications',
        des:[
            {
                method:'POST',
                body:`
{
    ID?: number;
    STATUS?: string;
    DEPT_ID?: number;
    SERVICE_DATE?: string;
    SERVICE_DESC?: string;
    IMAGES?: string;
    CONTACT?: string;
    MOBILE?: string;
    HANDLER?: string;
    TYPE?: string;
    REMARK?: string;
    HANDLE_TIME?: number;
    HANDLE_TIME_UNIT?: string;
    RESET_FLAG?: string;
    MANUAL_FLAG?: string;
    COMPANY_ID?: string;
    TIME_ID?: number;
    SCORE?: number;
    PROCESS_TIME?: string;
}`,
                results:[{
                    code:200,
                    data: `ID数字`
                }],
                body_example:`
{
    ID:0,
    status:New,
    DEPT_ID:1,
    SERVICE_DATE: 2018-03-23,
    TIME_ID: 3,
    SERVICE_DESC: 需要安装XXX,
    CONTACT: FX823,
    MOBILE: 1416
}`,
                tip:'更新及插入服务，带插入及抢单验证',
                url_example: ''
            }
        ]
    }
}