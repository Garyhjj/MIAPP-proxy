const path = require('path'),
    ReptilianMail = require('../../utils/reptilian-mail'),
    db = require('../../../lib/oracleDB');


const reptilianMail = new ReptilianMail({
    title: `MSL年資分析報表`,
    fileNamePrefix: 'salary-analysis' + '-',
    templatePath: path.resolve(__dirname, '../../views/salary-analysis.ejs'),
    appType: 1,
    imgNameList: ['table.png', 'char1.png', 'char2.png', 'char3.png', 'char4.png'],
})

reptilianMail.getMailto = async function () {
    const res = await db.execute(`select apps.MHT_GET_MAIL_ADDRESS_FUN@micerp('SENIORITY') MAILS from dual`);
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
    page.on('response', request => {
        const url = request.url().toLowerCase();
        if (url.indexOf('getsenioritytotal') > -1) {
            dataResolve(1)
        }
    });
    await page.goto('http://miwebapi.mic.com.cn/#/chart.component/e-r-p-%E4%BA%BA%E5%8A%9B%E8%B5%84%E6%BA%90/salary-analysis.component');
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
    return await page.$$('.chart').then(els => {
        if (els && els.length > 0) {
            return els.reduce((a, b) => a.then((idx) => b.screenshot({
                path: this.getCacheFilePath(this.imgNameList[idx]),
                type: 'png',
            }).then(() => idx + 1)), Promise.resolve(1))
        }
    })
}

module.exports = reptilianMail;