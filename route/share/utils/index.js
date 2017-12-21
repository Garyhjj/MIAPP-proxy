const TipsCollection = require('./TipsCollection');
const getIPQATips = require('../../IPQA/share/utils/getAllTips');

module.exports = {
    getAllTips: new TipsCollection(getIPQATips)
}