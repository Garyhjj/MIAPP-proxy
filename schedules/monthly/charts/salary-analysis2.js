const path = require('path'),
    ReptilianMail = require('../../utils/reptilian-mail'),
    db = require('../../../lib/oracleDB'),
    promisify = require('../../../util').promisify,
    readFileP = promisify(require('fs').readFile);
const devices = require('puppeteer/DeviceDescriptors');

const reptilianMail = new ReptilianMail({
    title: `MSL年資分析報表`,
    fileNamePrefix: 'salary-analysis2' + '-',
    templatePath: path.resolve(__dirname, '../../views/salary-analysis2.ejs'),
    appType: 1,
    imgNameList: ['char1.png', 'char2.png', 'char3.png', 'char4.png'],
})

reptilianMail.goToApp = async function (page) {
    await page.emulate(devices['iPad Pro'])
    const targetHTML = await readFileP(path.resolve(__dirname, './test.html')).then((ds) => Buffer.from(ds).toString());
    await page.setContent(targetHTML);
}
reptilianMail.afterGoToApp = async function (page) {
    await page.waitFor(500);
    return await page.$$('.c6 img').then(els => {
        if (els && els.length > 0) {
            return els.reduce((a, b) => a.then((idx) => b.screenshot({
                path: this.getCacheFilePath(this.imgNameList[idx]),
                type: 'png',
            }).then(() => idx + 1)), Promise.resolve(1))
        }
    })
}

reptilianMail.beforeRender = (p) => {
    const imgs = p.imgs;
    p.imgs1 = imgs.slice(0, 2);
    p.imgs2 = imgs.slice(2);
    return p;
}

reptilianMail.getMailto = async function () {
    const res = await db.execute(`select apps.MHT_GET_MAIL_ADDRESS_FUN@micerp('SENIORITY') MAILS from dual`);
    const ls = res.rows;
    if (ls.length > 0) {
        return ls[0].MAILS.split(',').concat([this.admin])
    } else {
        return this.admin
    }
}

module.exports = reptilianMail;