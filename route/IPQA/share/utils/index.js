const BossTipsCollection = require('./getBossTips');
const EquipTipsCollection = require('./getEquipTips');
const bossTipsCollection = new BossTipsCollection();
const equipTipsCollection = new EquipTipsCollection();

module.exports = {
    bossTipsCollection,
    equipTipsCollection
}