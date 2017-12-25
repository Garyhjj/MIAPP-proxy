const rxjs = require('rxjs');

class TipsCollection {
    constructor(...sub) {
        this.subTipsCollection = [];
        if (!sub) return;
        if (sub.length === 0) return;
        this.subTipsCollection = sub;
    }
    getNewTips(ctx) {
        let body = ctx.request.body;
        this.tips = [];
        let ids = body.moduleId || [];
        if (this.subTipsCollection.length === 0 || ids.length === 0) return Promise.resolve(this.tips);
        let req = this.subTipsCollection.filter((s) => ids.indexOf(s.id) > -1).map((sub) => sub.getNewTips(ctx));
        return Promise.all(req)
    }
}

module.exports = TipsCollection;