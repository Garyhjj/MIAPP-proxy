const base = require('../base');

const IPQA = {
    getMachineCheckList: 'IPQA/GetMachineCheckList?machineNO={machineNO}',
    getExcReportData: base.proxy + 'IPQA/GetExcReportData?problemStatus={problemStatus}&empno={empno}&type={type}&company_name={company_name}&skipRows=&pageSize=&boss_empno=&qa_empno=&closer_empno=',
    getMriName: base.proxy + 'IPQA/GetMRIName?company_name={company_name}&type={type}'
}

module.exports = IPQA;