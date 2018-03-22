module.exports = {
    info:{
        route: 'applications/server',
        des:[
            {
                method:'get',
                parmas: [
                    {
                        name: 'empno',
                        type: 'string类型,工号，不传则返回全部',
                        canNull: true,
                    },
                    {
                        name: 'status',
                        type: 'string类型, New | Processing',
                        canNull: true,
                    },
                    {
                        name: 'deptID',
                        type: 'number类型， 1',
                        canNull: true,
                    }
                ],
                results:[{
                    code:200,
                    data: `
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
}[]`
                }],
                tip: '获得服务人员的需要查看的申请表',
                url_example: '?empno=FX823&status=New&deptID=1'
            }
        ]
    }
}