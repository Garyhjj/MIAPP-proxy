let storeList = [];
class UpdateStoreWithLock {
  constructor(name, uniqueKey) {
    if (name === void 0 || uniqueKey === void 0) {
      throw new Error("参数不足");
    }
    this.name = name;
    this.uniqueKey = uniqueKey;
    this.updatingList = {};
    this.waitingList = [];
    this.timeID = null;
  }

  doUpdate() {
    if (this.waitingList.length > 0) {
      const req = this.waitingList.shift();
      const key = req.key;
      if (this.updatingList.hasOwnProperty(key)) {
        this.waitingList.push(req);
      } else {
        this.updatingList[key] = true;
        req.fn(req.data).then(res => {
          delete this.updatingList[key];
          req.resolve(res);
        });
      }
    } else {
      this.timeID = null;
      return;
    }
    this.timeID = setTimeout(() => this.doUpdate(), 0);
  }
  update(fn, data) {
    if (!this._isDataValid(data)) {
      return Promise.reject("invalid data");
    } else {
      return new Promise(resolve => {
        const key = data[this.uniqueKey];
        this.waitingList.push({
          fn: fn,
          data: data,
          key: key,
          resolve: resolve
        });
        setTimeout(() => {
          if (!this.timeID) {
            this.doUpdate();
          }
        }, 0);
      });
    }
  }
  _isDataValid(data) {
    if (typeof data === "object" && data !== null) {
      return true;
    } else {
      throw new Error(data + "不是有效对象");
    }
  }
  isUniquekeyValid(data) {
    return !!data[this.uniqueKey];
  }
}

function updateStoreWithLockResolve(name, uniqueKey) {
  storeList = storeList || [];
  const store = storeList.find(
    s => s.name === name && s.uniqueKey === uniqueKey
  );
  if (store) {
    return store;
  } else {
    const _store = new UpdateStoreWithLock(name, uniqueKey);
    storeList.push(_store);
    return _store;
  }
}

module.exports = {
  updateStoreWithLockResolve
};
