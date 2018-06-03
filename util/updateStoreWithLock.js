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
    this._outTime = 1000 * 60;
  }
  setOutTime(n) {
    if (typeof n === "number") {
      this._outTime = n;
    }
  }
  doUpdate() {
    if (this.waitingList.length > 0) {
      const req = this.waitingList.shift();
      const {
        key,
        params
      } = req;
      if (this.isUniquekeyValid(params)) {
        const nowTime = new Date().getTime();
        if (
          this.updatingList.hasOwnProperty(key) &&
          nowTime - this.updatingList[key] < this._outTime
        ) {
          this.waitingList.push(req);
        } else {
          this.updatingList[key] = nowTime;
          req
            .fn(...params)
            .then(res => {
              delete this.updatingList[key];
              req.resolve(res);
            })
            .catch(err => {
              delete this.updatingList[key];
              req.reject(err);
            });
        }
      } else {
        req
          .fn(...params)
          .then(res => {
            req.resolve(res);
          })
          .catch(err => {
            req.reject(err);
          });
      }
    } else {
      this.timeID = null;
      return;
    }
    this.timeID = setTimeout(() => this.doUpdate(), 0);
  }
  update(fn, ...params) {
    const data = params[0];
    if (!this._isDataValid(data)) {
      return Promise.reject("invalid data");
    } else {
      return new Promise((resolve, reject) => {
        const key = data[this.uniqueKey];
        this.waitingList.push({
          fn,
          params: Array.from(params),
          key,
          resolve,
          reject
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

function updateStoreWithLockResolver(name, uniqueKey) {
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
  updateStoreWithLockResolver
};