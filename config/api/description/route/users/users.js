module.exports = {
    info:{
        route: 'tips',
        des:[
            {
                method:'POST',
                body:`{
                    empno:string,
                    company_name:string
                }`,
                results:[{
                    code:200,
                    data: `非负整数`
                }],
                body_example:`{
                    empno:FX823,
                    company_name:MSL
                }`,
                tip:'获得所有模块的提示数',
                url_example: ''
            }
        ]
    }
}