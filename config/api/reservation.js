const base = require('../base');

const reservation = {
    getApplications: base.proxy + 'Service/GetServices?docno={docno}&status={status}&contact={contact}&handler={handler}&type={type}&company_id={company_id}&date_fm={date_fm}&date_to={date_to}',
    getPersonList: base.proxy + 'Service/GetServicePersons?dept_id={dept_id}',
    getDeptMes: base.proxy + 'Service/GetServiceDepartments?dept_no={dept_no}&company_id={company_id}',
    getServiceDayInfo: base.proxy + 'Service/GetServiceInfo?dept_id={dept_id}&date={date}',
    updateApplication: base.proxy + 'Service/UpdateSrvice'
}

module.exports = reservation;