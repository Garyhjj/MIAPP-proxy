const base = require("../base");

const IPQA = {
  getMachineCheckList: "IPQA/GetMachineCheckList?machineNO={machineNO}",
  getExcReportData: base.proxy +
    "IPQA/GetExcReportData?problemStatus={problemStatus}&empno={empno}&type={type}&company_name={company_name}&skipRows={skipRows}&pageSize={pageSize}&boss_empno={boss_empno}&qa_empno={qa_empno}&closer_empno={closer_empno}",
  getMriName: base.proxy + "IPQA/GetMRIName?company_name={company_name}&type={type}",
  getProblemTrack: base.proxy +
    "IPQA/GetProblemTrack?nameID={nameID}&dateFM={dateFM}&dateTO={dateTO}&company_name={company_name}&type={type}",
  getEmployeeSchedule: base.proxy + "IPQA/GetEmployeeSchedule?company={company}",
  getTracProblems: base.proxy +
    "IPQA/GetProblemTrack?nameID={nameID}&dateFM={dateFM}&dateTO={dateTO}&company_name={company_name}&type={type}",
  getLinesById: base.proxy + "IPQA/GetReport?header_id={header_id}",
  getScheduleInfo: base.proxy +
    "IPQA/GetScheduleInfo?nameID={nameID}&dateFM={dateFM}&dateTO={dateTO}",
  GetHeaderLinesReport: base.proxy + "IPQA/GetHeaderLinesReport",
  UploadReport: base.proxy + "IPQA/UploadReport",
  getReportData: base.proxy + "IPQA/GetReport",
  uploadMachineHdr: base.proxy + "IPQA/UploadMachineHdr",
};

module.exports = IPQA;