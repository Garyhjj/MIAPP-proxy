const TipsCollection = require('./tipsCollection');
const getIPQATips = require('../../IPQA/share/utils/getAllTips');
const getAttTips = require('../../attendance/share/utils/getAttTips');

module.exports = {
    getAllTips: new TipsCollection(getIPQATips,getAttTips)
}
