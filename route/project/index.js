const Router = require("koa-router"),
    util = require("../../util"),
    isErr = util.isReqError,
    jwtCheck = require("../../middlewares/").jwtCheck,
    projectHeaders = require('../../tables/project/moa_project_headers'),
    projectLines = require('../../tables/project/moa_project_lines'),
    projectPeople = require('../../tables/project/moa_project_people'),
    projectLineProgress = require('../../tables/project/moa_project_line_progress'),
    projectLineComments = require('../../tables/project/moa_project_line_comments'),
    projectHistory = require('../../tables/project/moa_project_history'),
    getChangeProp = require('../../tables/share/util').getChangeProp,
    getUserID = util.getUserID,
    httpErr400 = util.httpErr400;

var router = new Router({
    prefix: "/projects"
});

function normalUpdateHistoryForPost(new_data, old_data, targetType, userID, moreIgnore) {
    const header_id = new_data.HEADER_ID;
    const id = new_data.ID;
    moreIgnore = moreIgnore || [];
    if (old_data) {
        const ignore = ['LAST_UPDATED_BY', 'LAST_UPDATED_DATE', 'CREATION_DATE', 'CREATED_BY', 'ID', 'DELETE_FLAG'].concat(moreIgnore);
        const changeProp = getChangeProp(new_data, old_data, ignore);
        if (changeProp.length > 0) {
            const history = {
                HEADER_ID: header_id,
                TARGET_TYPE: targetType,
                TARGET_ID: id,
                DIFF: changeProp.join(','),
                CHANGE_TYPE: 2,
                BEFORE_STORE: JSON.stringify(old_data),
                AFTER_STORE: JSON.stringify(new_data)
            }
            projectHistory.update(history, userID);
        }
    } else {
        const history = {
            HEADER_ID: header_id,
            TARGET_ID: id,
            TARGET_TYPE: targetType,
            DIFF: '',
            CHANGE_TYPE: 1,
            AFTER_STORE: JSON.stringify(new_data)
        }
        projectHistory.update(history, userID);
    }
}

router.use(jwtCheck);

// 项目头部开始
router.get('/headers', async (ctx) => {
    const query = ctx.query;
    const member = query.member;
    const parent = query.parent;
    let err, data;
    if (typeof member === 'string' && member) {
        data = await projectHeaders.searchByMember(query).catch((e) => {
            err = e.message ? e.message : e;
        });
    } else if (parent) {
        const {
            children
        } = await projectHeaders.getAllChildrenAndIDList(parent).catch(e => {
            err = e.message ? e.message : e
        });
        data = children;
    } else {
        data = await projectHeaders.search(query).catch((e) => {
            err = e.message ? e.message : e;
        });
    }
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

router.post('/headers', async (ctx) => {
    const body = ctx.request.body;
    const {
        setParent
    } = ctx.query;
    let userID = ctx.miUser && getUserID(ctx);
    const afterUpdate = (new_data, old_data) => {
        const id = new_data.ID;
        if (old_data) {
            const ignore = ['LAST_UPDATED_BY', 'LAST_UPDATED_DATE', 'CREATION_DATE', 'CREATED_BY', 'ID', 'FINISHED_PECENT', 'CLOSED_TASKS_COUNT', 'TOTAL_TASKS_COUNT', 'DELETE_FLAG'];
            const changeProp = getChangeProp(new_data, old_data, ignore)
            if (changeProp.length > 0) {
                const history = {
                    HEADER_ID: id,
                    TARGET_ID: id,
                    TARGET_TYPE: 1,
                    DIFF: changeProp.join(','),
                    CHANGE_TYPE: 2,
                    BEFORE_STORE: JSON.stringify(old_data),
                    AFTER_STORE: JSON.stringify(new_data)
                }
                projectHistory.update(history, userID);
            }
        } else {
            const history = {
                HEADER_ID: id,
                TARGET_ID: id,
                TARGET_TYPE: 1,
                DIFF: '',
                CHANGE_TYPE: 1,
                AFTER_STORE: JSON.stringify(new_data)
            }
            projectHistory.update(history, userID);
        }
    }
    let err, data;
    if (setParent) {
        data = await projectHeaders.updateParentHeader(body, userID, {
            afterUpdate
        }).catch((e) => {
            err = e.message ? e.message : e;
        });
    } else {
        data = await projectHeaders.updateWithLock(body, userID, {
            afterUpdate
        }).catch((e) => {
            err = e.message ? e.message : e;
        });
    }

    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})
router.delete('/headers', async (ctx) => {
    const id = ctx.query.id;
    let userID = getUserID(ctx);
    let err;
    await projectHeaders.del(id, userID).then((res) => {
        const history = {
            HEADER_ID: id,
            TARGET_ID: id,
            TARGET_TYPE: 1,
            DIFF: '',
            CHANGE_TYPE: 3
        }
        projectHistory.update(history, userID);
        return res;
    }).catch((e) => {
        err = e.message ? e.message : e;
    });;
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = {};
    }
})
// 项目头部结束

// 项目任务开始

router.get('/lines', async (ctx) => {
    const query = ctx.query;
    let err;
    const data = await projectLines.search(query).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    };
})

router.post('/lines', async (ctx) => {
    const body = ctx.request.body;
    let userID = getUserID(ctx);
    let err;
    const data = await projectLines.updateWithLock(body, userID, {
        afterUpdate: (new_data, old_data) => {
            normalUpdateHistoryForPost(new_data, old_data, 2, userID)
        }
    }).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})
router.delete('/lines', async (ctx) => {
    const {
        id,
        header_id
    } = ctx.query;
    let err;
    let userID = getUserID(ctx);
    await projectLines.del(id, userID).then(res => projectLines.search({
        id: id
    })).then((res) => {
        if (Array.isArray(res) && res.length > 0) {
            const history = {
                HEADER_ID: +header_id,
                TARGET_ID: +id,
                TARGET_TYPE: 2,
                DIFF: '',
                CHANGE_TYPE: 3,
                AFTER_STORE: JSON.stringify(res[0])
            }
            projectHistory.update(history, userID);
        }
        return res;
    }).catch((e) => {
        err = e.message ? e.message : e;
    });;
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = {};
    }
})

// 项目任务结束


// 项目人员开始
router.get('/people', async (ctx) => {
    const query = ctx.query;
    let err;
    const data = await projectPeople.search(query).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

router.post('/people', async (ctx) => {
    const body = ctx.request.body;
    let err;
    let userID = getUserID(ctx);
    const data = await projectPeople.update(body, userID, {
        afterUpdate: (new_data, old_data) => {
            normalUpdateHistoryForPost(new_data, old_data, 3, userID)
        }
    }).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})
router.delete('/people', async (ctx) => {
    const {
        id,
        header_id
    } = ctx.query;
    let err;
    let userID = getUserID(ctx);
    await projectPeople.del(id, userID).then(res => projectPeople.search({
        id: id
    })).then((res) => {
        if (Array.isArray(res) && res.length > 0) {
            const history = {
                HEADER_ID: +header_id,
                TARGET_ID: +id,
                TARGET_TYPE: 3,
                DIFF: '',
                CHANGE_TYPE: 3,
                AFTER_STORE: JSON.stringify(res[0])
            }
            projectHistory.update(history, userID);
        }
        return res;
    }).catch((e) => {
        err = e.message ? e.message : e;
    });;
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = {};
    }
})
// 项目人员结束

// 任务进度开始
router.get('/lines/progress', async (ctx) => {
    const query = ctx.query;
    let err;
    const data = await projectLineProgress.search(query).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

router.post('/lines/progress', async (ctx) => {
    const body = ctx.request.body;
    let err;
    let userID = getUserID(ctx);
    const data = await projectLineProgress.update(body, userID, {
        afterUpdate: (new_data, old_data) => {
            normalUpdateHistoryForPost(new_data, old_data, 4, userID)
        }
    }).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})
router.delete('/lines/progress', async (ctx) => {
    const id = ctx.query.id;
    let err;
    await projectLineProgress.del(id, getUserID(ctx)).catch((e) => {
        err = e.message ? e.message : e;
    });;
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = {};
    }
})
// 任务进度结束

// 任务评论开始

router.get('/lines/comments', async (ctx) => {
    const query = ctx.query;
    let err;
    const data = await projectLineComments.search(query).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

router.post('/lines/comments', async (ctx) => {
    const body = ctx.request.body;
    let err;
    let userID = getUserID(ctx);
    const data = await projectLineComments.update(body, userID, {
        afterUpdate: (new_data, old_data) => {
            normalUpdateHistoryForPost(new_data, old_data, 5, userID)
        }
    }).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})
router.delete('/lines/comments', async (ctx) => {
    const id = ctx.query.id;
    let err;
    await projectLineComments.del(id, getUserID(ctx)).catch((e) => {
        err = e.message ? e.message : e;
    });;
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = {};
    }
})

// 任务评论结束

// 项目历史开始

router.get('/history', async (ctx) => {
    const query = ctx.query;
    let err;
    const data = await projectHistory.search(query).catch((e) => {
        err = e.message ? e.message : e;
    });
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

// 项目历史结束
module.exports = router;