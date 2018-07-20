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
    httpErr400 = util.httpErr400,
    projectUtil = require('./share/utils'),
    sendMail = require('../../tables/share/util').sendMail,
    {
        ApiDescriptionGroup
    } = require('../../util/apiDescription');

var router = new Router({
    prefix: "/projects"
});

const apiDescriptionGroup = new ApiDescriptionGroup(router);
router.use(jwtCheck);

function normalUpdateHistoryForPost(new_data, old_data, targetType, userID, moreIgnore, doMoreChangeProp) {
    const header_id = new_data.HEADER_ID;
    const id = new_data.ID;
    moreIgnore = moreIgnore || [];
    if (old_data) {
        const ignore = ['LAST_UPDATED_BY', 'LAST_UPDATED_DATE', 'CREATION_DATE', 'CREATED_BY', 'ID', 'DELETE_FLAG'].concat(moreIgnore);
        let changeProp = getChangeProp(new_data, old_data, ignore);
        if (typeof doMoreChangeProp === 'function') {
            changeProp = doMoreChangeProp(changeProp, new_data, old_data);
        }
        if (changeProp.length > 0) {
            const history = {
                HEADER_ID: header_id,
                TARGET_TYPE: targetType,
                TARGET_ID: id,
                DIFF: changeProp.join(','),
                CHANGE_TYPE: 2,
                BEFORE_STORE: old_data,
                AFTER_STORE: new_data
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
            AFTER_STORE: new_data
        }
        projectHistory.update(history, userID);
    }
}

apiDescriptionGroup.add({
    tip: '获取项目列表',
    params: [{
        name: 'member',
        type: '组员工号',
        example: 'FX823'
    }, {
        name: 'parent',
        type: '父项目编号',
        example: 'M2018070011'
    }, {
        name: 'status',
        type: '状态',
        example: 'Open'
    }, {
        name: 'startDate',
        type: '根据截止时间的开始范围',
        example: '2018-07-01'
    }, {
        name: 'endDate',
        type: '根据截止时间的结束范围',
        example: '2018-07-21'
    }, {
        name: 'owner',
        type: '负责人工号',
        example: 'FX823'
    }],
    results: [{
        code: 200,
        fromTable: 'moa_project_headers',
        dataIsArray: true
    }]
});

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
    } else if (typeof parent === 'string') {
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

apiDescriptionGroup.add({
    tip: '更新或插入项目',
    bodyFromTable: 'moa_project_headers',
    bodyCanArray: true,
    params: [{
        name: 'setParent',
        type: '1,用于更新parent_header的栏位,有额外验证',
        example: '1'
    }],
    results: [{
        code: 200,
        data: `number[] or number`
    }]
});
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
                    BEFORE_STORE: old_data,
                    AFTER_STORE: new_data
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
                AFTER_STORE: new_data
            }
            projectHistory.update(history, userID);
        }
    }
    let err, data;
    if (setParent) {
        if (Array.isArray(body)) {
            data = await Promise.all(body.map(q => projectHeaders.updateParentHeader(q, userID, {
                afterUpdate
            }))).catch((e) => {
                err = e.message ? e.message : e;
            });
        } else {
            data = await projectHeaders.updateParentHeader(body, userID, {
                afterUpdate
            }).catch((e) => {
                err = e.message ? e.message : e;
            });
        }
    } else {
        if (Array.isArray(body)) {
            data = await Promise.all(body.map(q => projectHeaders.updateWithLock(q, userID, {
                afterUpdate
            }))).catch((e) => {
                err = e.message ? e.message : e;
            });
        } else {
            data = await projectHeaders.updateWithLock(body, userID, {
                afterUpdate
            }).catch((e) => {
                err = e.message ? e.message : e;
            });
        }
    }
    if (err) {
        ctx.response.status = 400;
        ctx.response.body = err;
    } else {
        ctx.response.body = data;
    }
})

apiDescriptionGroup.add({
    tip: '删除项目信息',
    params: [{
        name: 'id',
        type: '项目id',
        example: '99'
    }],
    results: [{
        code: 200,
        data: '{}'
    }]
});
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

apiDescriptionGroup.add({
    tip: '获得任务列表',
    params: [{
        name: 'header_id',
        type: 'number,所属项目的id',
        example: '99'
    }, {
        name: 'status',
        type: '状态',
        example: 'open'
    }, {
        name: 'assignee',
        type: '处理人工号',
        example: 'FX823'
    }, {
        name: 'startDate',
        type: '根据截止时间的开始范围',
        example: '2018-07-01'
    }, {
        name: 'endDate',
        type: '根据截止时间的结束范围',
        example: '2018-07-21'
    }, {
        name: 'id',
        type: 'number,任务id',
        example: '99'
    }, {
        name: 'owner',
        type: '工号,所属项目的负责人',
        example: 'FX823'
    }, {
        name: 'customer',
        type: '客户',
        example: 'intel'
    }, {
        name: 'bu',
        type: '所属bu',
        example: 'EBU'
    }, {
        name: 'code',
        type: '编号',
        example: 'T20180603'
    }, {
        name: 'model',
        type: '产品',
        example: 'M50'
    }, {
        name: 'type',
        type: '种类',
        example: 'FX823'
    }],
    results: [{
        code: 200,
        fromTable: 'moa_project_lines',
        dataIsArray: true
    }]
});
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

const afterUpdateForLine = (new_data, old_data, userID, autoMail) => {
    const fileProperty = 'ATTACHMENT';
    if (!old_data && new_data.ASSIGNEE && autoMail) {
        projectUtil.prepare_task_new_assignee_mail(new_data.ASSIGNEE, new_data.ID).then(() => sendMail()).catch((err) => console.error(err));
    }
    normalUpdateHistoryForPost(new_data, old_data, 2, userID, [fileProperty], (changeProp, n, o) => {
        let oldFileList = o[fileProperty];
        try {
            oldFileList = JSON.parse(oldFileList);
            o[fileProperty] = oldFileList;
        } catch (e) {
            oldFileList = [];
        }
        if (autoMail && changeProp.indexOf('ASSIGNEE') > -1) {
            let req = [];
            const oldAss = old_data.ASSIGNEE,
                newAss = new_data.ASSIGNEE;
            if (newAss) {
                req.push(projectUtil.prepare_task_new_assignee_mail(newAss, new_data.ID));
            }
            if (oldAss) {
                if (newAss) {
                    req.push(projectUtil.prepare_task_old_assignee_mail(oldAss, old_data.ID));
                } else {
                    req.push(projectUtil.prepare_task_assignee_reject(oldAss, old_data.ID))
                }
            }
            if (req.length > 0) {
                Promise.all(req).then(() => sendMail()).catch((err) => console.error(err));
            }
        }
        const oLg = Array.isArray(oldFileList) ? oldFileList.length : 0;
        const newFileList = n[fileProperty] ? n[fileProperty] : [];
        const nLg = Array.isArray(newFileList) ? newFileList.length : 0;
        if (oLg === 0 && nLg === 0) {
            return changeProp;
        } else if (oLg !== nLg) {
            changeProp.push(fileProperty);
        } else {
            if (new Set(oldFileList.concat(newFileList)).size !== oLg) {
                changeProp.push(fileProperty);
            }
        }
        return changeProp;
    })
}

apiDescriptionGroup.add({
    tip: '更新或插入任务',
    bodyFromTable: 'moa_project_lines',
    bodyCanArray: true,
    results: [{
        code: 200,
        data: `number[] or number`
    }]
});
router.post('/lines', async (ctx) => {
    const body = ctx.request.body;
    let userID = getUserID(ctx);
    let err;
    if (Array.isArray(body)) {
        data = await Promise.all(body.map(q => projectLines.updateWithLock(q, userID, {
            afterUpdate: (new_data, old_data) => {
                afterUpdateForLine(new_data, old_data, userID);
            }
        }))).catch((e) => {
            err = e.message ? e.message : e;
        });
    } else {
        data = await projectLines.updateWithLock(body, userID, {
            afterUpdate: (new_data, old_data) => {
                afterUpdateForLine(new_data, old_data, userID, true);
            }
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

apiDescriptionGroup.add({
    tip: '删除任务信息',
    params: [{
        name: 'id',
        type: '任务id',
        example: '99'
    }],
    results: [{
        code: 200,
        data: '{}'
    }]
});
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
                AFTER_STORE: res[0]
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

apiDescriptionGroup.add({
    tip: '获得项目组员',
    params: [{
            name: 'id',
            type: '组员id',
            example: '5'
        },
        {
            name: 'header_id',
            type: '所属项目id',
            example: '99'
        }
    ],
    results: [{
        code: 200,
        fromTable: 'moa_project_people',
        dataIsArray: true
    }]
});
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

apiDescriptionGroup.add({
    tip: '更新或插入项目组员',
    bodyFromTable: 'moa_project_people',
    results: [{
        code: 200,
        data: `number`
    }]
});
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

apiDescriptionGroup.add({
    tip: '删除项目组员',
    params: [{
            name: 'id',
            type: '组员id',
            example: '5'
        },
        {
            name: 'header_id',
            type: '所属项目id,这是为了插入历史记录',
            example: '99'
        }
    ],
    results: [{
        code: 200,
        data: '{}'
    }]
});
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
                AFTER_STORE: res[0]
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

apiDescriptionGroup.add({
    tip: '获得任务进度',
    params: [{
        name: 'line_id',
        type: '所属任务id',
        example: '5'
    }],
    results: [{
        code: 200,
        fromTable: 'moa_project_line_progress',
        dataIsArray: true
    }]
});
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

apiDescriptionGroup.add({
    tip: '更新或插入任务进度',
    bodyFromTable: 'moa_project_line_progress',
    results: [{
        code: 200,
        data: `number`
    }]
});
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

apiDescriptionGroup.add({
    tip: '删除任务进度',
    params: [{
        name: 'id',
        type: '进度id',
        example: '5'
    }],
    results: [{
        code: 200,
        data: '{}'
    }]
});
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

apiDescriptionGroup.add({
    tip: '获得任务留言',
    params: [{
        name: 'line_id',
        type: '所属任务id',
        example: '5'
    }],
    results: [{
        code: 200,
        fromTable: 'moa_project_line_comments',
        dataIsArray: true
    }]
});
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

apiDescriptionGroup.add({
    tip: '更新或插入任务留言',
    bodyFromTable: 'moa_project_line_comments',
    results: [{
        code: 200,
        data: `number`
    }]
});
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

apiDescriptionGroup.add({
    tip: '删除任务留言',
    params: [{
        name: 'id',
        type: '留言id',
        example: '5'
    }],
    results: [{
        code: 200,
        data: '{}'
    }]
});
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

apiDescriptionGroup.add({
    tip: '获得项目的历史记录',
    params: [{
            name: 'header_id',
            type: '所属任务id',
            example: '5'
        },
        {
            name: 'page',
            type: '第几页',
            example: '2'
        }
    ],
    results: [{
        code: 200,
        fromTable: 'moa_project_history',
        dataIsArray: true
    }]
});
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