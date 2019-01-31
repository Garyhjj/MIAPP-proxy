const moment = require('moment'),
    path = require('path'),
    ReptilianMail = require('../../utils/reptilian-mail'),
    db = require('../../../lib/oracleDB');
const devices = require('puppeteer/DeviceDescriptors');


const reptilianMail = new ReptilianMail({
    title: `MSL${moment().format('YYYY')}月离职率分析`,
    fileNamePrefix: 'dimission-analysis' + '-',
    templatePath: path.resolve(__dirname, '../../views/dimission-analysis.ejs'),
    appType: 1,
    imgNameList: ['tableTotal.png', 'charTotal.png', 'subTable1.png', 'subChart1.png', 'subTable2.png', 'subChart2.png', 'subTable3.png', 'subChart3.png'],
})
reptilianMail.getMailto = async function () {
    const res = await db.execute(`select apps.MHT_GET_MAIL_ADDRESS_FUN@micerp('MHT_LEAVE_RATE_PKG') MAILS from dual`);
    const ls = res.rows;
    if (ls.length > 0) {
        return ls[0].MAILS.split(',').concat([this.admin])
    } else {
        return this.admin
    }
}
reptilianMail.afterGoToApp = async function (page) {
    let dataResolve;
    const dataPromise = new Promise((resolve) => {
        dataResolve = resolve
    });
    await page.emulate(devices['iPad Pro'])
    page.on('response', request => {
        const url = request.url().toLowerCase();
        if (url.indexOf('getleaveratedetail?type=t') > -1) {
            dataResolve(1)
        }
    });
    await page.goto('http://miwebapi.mic.com.cn/#/%E5%BA%94%E7%94%A8/chart.component/e-r-p-%E4%BA%BA%E5%8A%9B%E8%B5%84%E6%BA%90/dimission-analysis.component');
    await dataPromise;
    await page.waitFor(1200);
    await page.evaluate(() => {
        const table = document.querySelector('.myTable');
        if (table) {
            table.style.overflowX = 'auto';
        }
    });
    await page.waitFor(500);
    await page.$('.myTable').then(el => {
        return el.screenshot({
            path: this.getCacheFilePath(this.imgNameList[0]),
            type: 'png',
        });
    });
    await page.$('.chart').then(el => {
        return el.screenshot({
            path: this.getCacheFilePath(this.imgNameList[1]),
            type: 'png',
        });
    });
    const types = ['DL', 'IDL', 'S+A'];
    for (let i = 0; i < types.length; i++) {
        const type = types[i];
        await page.tap(`.segment-button[value="${type}"]`);
        await page.waitForSelector('.segment .myTable');
        await page.waitFor(1500);
        await page.$('.segment .myTable').then(el => {
            return el.screenshot({
                path: this.getCacheFilePath(this.imgNameList[i * 2 + 2]),
                type: 'png',
            });
        });
        await page.$('.segment .chart').then(el => {
            return el.screenshot({
                path: this.getCacheFilePath(this.imgNameList[i * 2 + 3]),
                type: 'png',
            });
        });
    }

}

module.exports = reptilianMail;