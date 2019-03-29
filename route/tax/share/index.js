const db = require('../../../lib/oracleDB'),
    reductionTable = require('../../../tables/tax/moa_tax_reduction'),
    util = require('../../../util'),
    toStoreString = require('../../../tables/share/util').toStoreString;
class TaxReduction {
    constructor(data) {
        Object.assign(this, data);
        const now = new Date();
        this.YEAR = now.getFullYear();
        const month = now.getMonth() + 1;
        this.MONTH = month < 10 ? '0' + month : month + '';
        // this.YEAR = '2019';
        // this.MONTH = '02'
        this.STATUS = data.STATUS ? data.STATUS : 'W';
    }
}

const EDUCATION_1 = 'CONTINUING_EDUCATION_1',
    EDUCATION_2 = 'CONTINUING_EDUCATION_2';

async function updateReduction(data, userID) {
    if (!Array.isArray(data)) {
        data = [data];
    }
    const target = util.arrayClassifyByOne(data, 'TYPE');
    if (target.hasOwnProperty('CONTINUING_EDUCATION')) {
        return Promise.reject('APP版本太低,无法操作,请更新APP!');
    }
    const now = new Date(),
        year = now.getFullYear(),
        // year = '2019';
        _month = now.getMonth() + 1,
        month = _month < 10 ? '0' + _month : _month + '';
    // month = '02';
    let waitToUpdateList = [],
        waitToDelType = [];
    // 记录继续教育的类型的位置
    // edu1 = -1, // 在教育
    // edu2 = -1; //  证书
    for (let prop in target) {
        if (target.hasOwnProperty(prop) && prop !== 'null') {
            const ls = target[prop];
            if (ls && ls.length > 0) {
                waitToDelType.push(prop);
                // if (prop === 'CONTINUING_EDUCATION') {
                //     const eduType = ls[0].EDUCATION_TYPE;
                //     const site = waitToDelType.length - 1;
                //     if (eduType === EDUCATION_1) {
                //         edu1 = site;
                //     } else if (eduType === EDUCATION_2) {
                //         edu2 = site;
                //     }
                // }
                waitToUpdateList = waitToUpdateList.concat(ls);
            }
        }
    }

    if (waitToDelType.length > 0) {
        const first = waitToUpdateList[0];
        const user_id = first.USER_ID,
            company_name = first.COMPANY_NAME;
        await Promise.all(waitToDelType.map((p, idx) => reductionTable.del({
            year,
            month,
            user_id,
            type: p,
            company_name,
            has_detail: ''
            // education_type: idx === edu1 ? EDUCATION_1 : idx === edu1 ? EDUCATION_2 : ''
        })));
        return Promise.all(waitToUpdateList.map(l => reductionTable.update(new TaxReduction(l), userID)));
    }
}

module.exports = {
    updateReduction
}