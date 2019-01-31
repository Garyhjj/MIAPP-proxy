const sduUtil = require('./index'),
    cachePath = require('../../constants').cachePath,
    puppeteer = require('puppeteer'),
    fs = require('fs'),
    errMailInformDecorator = require('../../util/error').errMailInformDecorator,
    ejs = require('consolidate').ejs,
    path = require('path'),
    moment = require('moment');


class ReptilianMail {
    constructor({
        fileNamePrefix,
        title,
        templatePath,
        appType = 1, // 1 mobile oa, 2 web oa
        imgNameList = [],
        admin = 'FX823',
        headless = true,
        fileNameDateFormat = 'YYYYMM'
    }) {
        this.fileNamePrefix = fileNamePrefix;
        this.title = title;
        this.templatePath = templatePath;
        this.appType = appType;
        this.imgNameList = Array.isArray(imgNameList) ? imgNameList : [imgNameList];
        this.admin = admin;
        this.cachePath = cachePath;
        this.headless = headless;
        this.fileNameDateFormat = fileNameDateFormat;
    }
    getFileNamePrefix() {
        return moment().format(this.fileNameDateFormat) + '-' + this.fileNamePrefix;
    }

    checkCacheFile() {
        return new Promise((resolve) => {
            fs.mkdir(this.cachePath, (err) => {
                resolve()
            })
        })
    }

    async goToApp(page) {
        switch (this.appType) {
            case 1:
                return sduUtil.goToMobileApp(page);
            default:
                return Promise.reject('未知的爬取目標app')
        }
    }

    async afterGoToApp(page, browser) {
        return null;
    }

    async getOnline() {
        return puppeteer.launch({
            headerless: this.headless
        }).then(async browser => {
            await this.checkCacheFile();
            const page = await browser.newPage();
            await this.goToApp(page);
            await this.afterGoToApp(page, browser);
            return browser.close();
        });
    };
    get sendMail() {
        return errMailInformDecorator(this._sendMail.bind(this), this.title);
    }

    getCacheFilePath(name) {
        return path.join(this.cachePath, this.getFileNamePrefix() + name)
    }

    set sendMail(fn) {
        this._sendMail = typeof fn === 'function' ? fn : this._sendMail;
    }

    async getMailto() {
        return this.admin;
    }
    async beforeRender(renderParams) {
        return renderParams;
    }
    async _sendMail() {
        const mailTo = await this.getMailto();
        const names = this.imgNameList;
        const prepareFile = () => {
            return new Promise((resolve, reject) => {
                if (names.length > 0) {
                    fs.readFile(this.getCacheFilePath(names[names.length - 1]), (err) => {
                        if (err) {
                            this.getOnline().then(() => resolve()).catch((e) => reject(e));
                        } else {
                            resolve();
                        }
                    })
                } else {
                    resolve();
                }
            })
        }
        const readFile = (name) => {
            const dir = this.getCacheFilePath(name);
            return new Promise((resolve, reject) => {
                resolve(dir);
            })
        }
        const images = [],
            attachments = [];
        await names.reduce((a, b) => {
            return a.then(() => {
                return readFile(b).then((img) => {
                    attachments.push({
                        filename: b,
                        path: img,
                        cid: b
                    });
                    images.push(`cid:${b}`)
                });
            })
        }, prepareFile())
        const renderParams = await this.beforeRender({
            title: this.title,
            imgs: images
        });
        const html = await ejs(this.templatePath, renderParams)
        const mailToMails = await sduUtil.getMail(mailTo);
        let mailOptions = {
            from: 'mitac.mail@mic.com.tw', // 发件地址
            to: mailToMails, // 收件列表
            subject: this.title, // 标题
            //text和html两者只支持一种
            html,
            attachments
        };
        return sduUtil.sendMail(mailOptions);
    };
    doSchedule() {
        return this.sendMail();
    }
}

module.exports = ReptilianMail