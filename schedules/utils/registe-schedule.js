const schedule = require('node-schedule'),
    dimissionAnslysis = require('../monthly/charts/dimission-analysis'),
    salaryAnalysis = require('../monthly/charts/salary-analysis2'),
    reservation = require('../others/reservation');

const scheduleList = []

function addSchedule(schedule, cron, isProduction = true) {
    if (typeof schedule.doSchedule === 'function') {
        scheduleList.push({
            schedule,
            cron,
            isProduction
        })
    }
}

// addSchedule(dimissionAnslysis, '0 9 1 * *');
// addSchedule(salaryAnalysis, '0 8 1 * *');

addSchedule(reservation, '0 8 * * *');
addSchedule(reservation, '0 12 * * *');
addSchedule(reservation, '0 16 * * *');

function registeSchedule(isPro) {
    scheduleList.forEach((s) => {
        if (isPro === s.isProduction) {
            schedule.scheduleJob(s.cron, function () {
                s.schedule.doSchedule();
            });
        }
    })
}
// schedule.scheduleJob('20 * * * * *', function () {
//     console.log(new Date())
// });
module.exports = registeSchedule;