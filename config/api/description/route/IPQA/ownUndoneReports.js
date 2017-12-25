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
                    },
                    {
                        name: 'empno',
                        type: 'string类型: FX823',
                        canNull: true,
                    }
                ],
                results:[{
                    code:200,
                    data: `
{
    HEADER_ID?: string;
    INSPECT_DATE?: string;
    INSPECT_TIME?: string;
    LOCATION?: string;
    LINE_ID?: string;
    PROBLEM_FLAG?: 'Y' | 'N' | '';
    PROBLEM_DESC?: string;
    PROBLEM_PICTURES?: string;
    PROBLEM_STATUS?: 'New' | 'Waiting' | 'Done' | 'Close' | 'Highlight' | 'WaitingBoss' | 'WaitingQA';
    OWNER_EMPNO?: string;
    BOSS_EMPNO?: string;
    QA_EMPNO?: string;
    CLOSER_EMPNO?: string;
    CLOSER_DESC?: string;
    CLOSE_DATE?: string;
    SCORE?: string;
    COMPANY_NAME?: string;
    ACTION_DATE?: string;
    ACTION_DESC?: string;
    ACTION_PICTURES?: string;
    ACTION_STATUS?: string;
    CHECK_ID?: string;
    CHECK_LIST_CN?: string;
    CHECK_LIST_EN?: string;
    MACHINE_ID?: string;
    MACHINE_NAME?: string;
    INSPECTOR?: string;
    DUTY_KIND?: string;
    NUM?: string;
    CORRECTDESC?: string;
    RELATION_PRODUCT?: string;
    PROBLEM_TYPE?: string;
    DUTY_DEPT?: string;
}`
                }],
                tip: '根据类别获得需要处理的报告',
                url_example: '?company_name=MSL&type=boss&empno=FX823'
            }
        ]
    }
}