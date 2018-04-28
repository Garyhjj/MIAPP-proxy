class ModuleTip {
    constructor(m, t, children) {
        this.MODULE_ID = m;
        this.TIPS = t;
        this.children = children || [];
    }
    addChildren(c) {
        if (!Array.isArray(this.children)) {
            this.children = [];
        }
        const add = (_) => {
            if (_ instanceof ModuleTip) {
                this.children.push(_);
            }
        }
        if (Array.isArray(c)) {
            c.forEach(_ => add(_));
        } else {
            add(c);
        }
    }
}


module.exports = {
    ModuleTip
}