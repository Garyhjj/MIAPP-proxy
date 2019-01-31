const {
    EasyRouter,
    getQuery,
    getBody,
    getUserID
} = require('../../util/easyRouter'),
    util = require("../../util"),
    isArray = util.isArray,
    jwtCheck = require("../../middlewares/").jwtCheck,
    projectHeaders = require('../../tables/project/moa_project_headers'),
    projectLines = require('../../tables/project/moa_project_lines'),
    projectPeople = require('../../tables/project/moa_project_people'),
    projectLineProgress = require('../../tables/project/moa_project_line_progress'),
    projectLineComments = require('../../tables/project/moa_project_line_comments'),
    projectHistory = require('../../tables/project/moa_project_history'),
    projectMailSetting = require('../../tables/project/moa_project_mail_setting'),
    projectLineAssignees = require('../../tables/project/moa_project_line_assignees'),
    getChangeProp = require('../../tables/share/util').getChangeProp,
    projectUtil = require('./share/utils'),
    sendMail = require('../../tables/share/util').sendMail, {
        ApiDescriptionGroup
    } = require('../../util/apiDescription');

var router = new EasyRouter({
    prefix: "/projects"
});

const apiDescriptionGroup = new ApiDescriptionGroup(router);
router.use(jwtCheck);

function normalUpdateHistoryForPost(new_data, old_data, targetType, userID, moreIgnore, doMoreChangeProp) {
    const header_id = new_data.HEADER_ID;
    const id = new_data.ID;
    moreIgnore = moreIgnore || [];
    let changeProp = [];
    if (old_data) {
        const ignore = ['LAST_UPDATED_BY', 'LAST_UPDATED_DATE', 'CREATION_DATE', 'CREATED_BY', 'ID', 'DELETE_FLAG'].concat(moreIgnore);
        changeProp = getChangeProp(new_data, old_data, ignore);
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
    return changeProp;
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
router.setAgs(getQuery);
router.get('/headers', async (query) => {
    const member = query.member;
    const parent = query.parent;
    let data;
    if (typeof member === 'string' && member) {
        data = await projectHeaders.searchByMember(query)
    } else if (typeof parent === 'string') {
        const {
            children
        } = await projectHeaders.getAllChildrenAndIDList(parent)
        data = children;
    } else {
        data = await projectHeaders.search(query)
    }
    return data;
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
router.setAgs(getBody, getUserID, getQuery)
router.post('/headers', async (body, userID, query) => {
    const {
        setParent
    } = query;
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
    let data;
    if (setParent) {
        if (Array.isArray(body)) {
            data = await Promise.all(body.map(q => projectHeaders.updateParentHeader(q, userID, {
                afterUpdate
            })));
        } else {
            data = await projectHeaders.updateParentHeader(body, userID, {
                afterUpdate
            });
        }
    } else {
        if (Array.isArray(body)) {
            data = await Promise.all(body.map(q => projectHeaders.updateWithLock(q, userID, {
                afterUpdate
            })));
        } else {
            data = await projectHeaders.updateWithLock(body, userID, {
                afterUpdate
            });
        }
    }
    return data;
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
router.setAgs(getQuery, getUserID)
router.delete('/headers', async (query, userID) => {
    const {
        id
    } = query;
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
    })
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
router.setAgs(getQuery)
router.get('/lines', async (query) => {
    return await projectLines.search(query);
})

const afterUpdateForLine = (new_data, old_data, userID, autoMail) => {
    const files = 'ATTACHMENT',
        assignees = 'ASSIGNEE';
    let newAssignee = new_data[assignees];
    if (!old_data && newAssignee && autoMail) {
        newAssignee = Array.isArray(newAssignee) ? newAssignee : [newAssignee];
        if (newAssignee.length > 0) {
            newAssignee.forEach(a => {
                projectUtil.prepare_task_new_assignee_mail(a, new_data.ID).then(() => sendMail()).catch((err) => console.error(err));
            })
        }
    }
    const changeList = normalUpdateHistoryForPost(new_data, old_data, 2, userID, [files, assignees], (changeProp, n, o) => {
        const arrayTest = (name) => {
            let oldFileList = o[name];
            try {
                oldFileList = JSON.parse(oldFileList);
                o[name] = oldFileList;
            } catch (e) {
                oldFileList = [];
            }
            oldFileList = Array.isArray(oldFileList) ? oldFileList : [oldFileList]
            const oLg = oldFileList.length;
            const newFileList = n[name] ? n[name] : [];
            const nLg = Array.isArray(newFileList) ? newFileList.length : 0;
            if (oLg === 0 && nLg === 0) {
                return changeProp;
            } else if (oLg !== nLg) {
                changeProp.push(name);
            } else {
                if (new Set(oldFileList.concat(newFileList)).size !== oLg) {
                    changeProp.push(name);
                }
            }
        }
        arrayTest(files);
        arrayTest(assignees);
        // 負責人更改時的郵件邏輯
        if (autoMail && changeProp.indexOf(assignees) > -1) {
            let req = [];
            let before = old_data.ASSIGNEE,
                now = new_data.ASSIGNEE;
            now = isArray(now) ? now : [now];
            before = isArray(before) ? before : [before];
            const addOne = now.filter(n => before.indexOf(n) < 0);
            const addList = addOne.length > 0 ? addOne : [];
            const deleteOne = before.filter(b => now.indexOf(b) < 0);
            const deleteList = deleteOne.length > 0 ? deleteOne : [];
            if (n.rejectFlag === 'Y') {
                deleteList.forEach(d => req.push(projectUtil.prepare_task_assignee_reject(d, old_data.ID)));
            } else {
                deleteList.forEach(d => req.push(projectUtil.prepare_task_old_assignee_mail(d, old_data.ID)));
                addList.forEach(a => req.push(projectUtil.prepare_task_new_assignee_mail(a, old_data.ID)));
            }
            if (req.length > 0) {
                Promise.all(req).then(() => sendMail()).catch((err) => console.error(err));
            }
        }
        return changeProp;
    })
    if (changeList.indexOf('DUE_DATE') > -1) {
        return projectLines.updateWithLock({
            ID: new_data.ID,
            MAIL_TYPE: 0
        }, userID);
    }
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
router.setAgs(getBody, getUserID)
router.post('/lines', async (body, userID) => {
    let assignee_list = body.ASSIGNEE_LIST || [];
    assignee_list = Array.from(new Set(assignee_list));
    body.ASSIGNEE = assignee_list;
    const updateAssigneeFn = (res) => {
        const updateAssignee = (line_id) => {
            return assignee_list.length > 0 ? Promise.all([assignee_list.map(a => projectLineAssignees.update({
                    ID: 0,
                    LINE_ID: line_id,
                    USER_NAME: a
                }, userID))])
                .then(() => res) : res;
        }
        if (body.ID > 0) {
            const id = body.ID;
            return projectLineAssignees.del(`delete from ${projectLineAssignees.tableName} where LINE_ID = ${id}`)()
                .then((r) => updateAssignee(id))
        } else {
            return updateAssignee(res)
        }
    }
    if (Array.isArray(body)) {
        data = await Promise.all(body.map(q => projectLines.updateWithLock(q, userID, {
            afterUpdate: (new_data, old_data) => {
                afterUpdateForLine(new_data, old_data, userID);
            }
        }).then((res) => updateAssigneeFn(res))));
    } else {
        data = await projectLines.updateWithLock(body, userID, {
            afterUpdate: (new_data, old_data) => {
                afterUpdateForLine(new_data, old_data, userID, true);
            }
        }).then((res) => updateAssigneeFn(res));
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
router.setAgs(getQuery, getUserID);
router.delete('/lines', async (query, userID) => {
    const {
        id,
        header_id
    } = query;
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
    });
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
router.setAgs(getQuery)
router.get('/people', async (query) => {
    return await projectPeople.search(query);
})

apiDescriptionGroup.add({
    tip: '更新或插入项目组员',
    bodyFromTable: 'moa_project_people',
    results: [{
        code: 200,
        data: `number`
    }]
});
router.setAgs(getBody, getUserID);
router.post('/people', async (body, userID) => {
    return await projectPeople.update(body, userID, {
        afterUpdate: (new_data, old_data) => {
            normalUpdateHistoryForPost(new_data, old_data, 3, userID)
        }
    })
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
router.setAgs(getQuery, getUserID);
router.delete('/people', async (query, userID) => {
    const {
        id,
        header_id
    } = query;
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
    });
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
router.setAgs(getQuery);
router.get('/lines/progress', async (query) => {
    return await projectLineProgress.search(query)
})

apiDescriptionGroup.add({
    tip: '更新或插入任务进度',
    bodyFromTable: 'moa_project_line_progress',
    results: [{
        code: 200,
        data: `number`
    }]
});
router.setAgs(getBody, getUserID);
router.post('/lines/progress', async (body, userID) => {
    return await projectLineProgress.update(body, userID, {
        afterUpdate: (new_data, old_data) => {
            normalUpdateHistoryForPost(new_data, old_data, 4, userID)
        }
    });
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
router.setAgs(getQuery, getUserID);
router.delete('/lines/progress', async (query, userID) => {
    const id = query.id;
    await projectLineProgress.del(id, userID);
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
router.setAgs(getQuery);
router.get('/lines/comments', async (query) => {
    return await projectLineComments.search(query);
})

apiDescriptionGroup.add({
    tip: '更新或插入任务留言',
    bodyFromTable: 'moa_project_line_comments',
    results: [{
        code: 200,
        data: `number`
    }]
});
router.setAgs(getBody, getUserID);
router.post('/lines/comments', async (body, userID) => {
    return await projectLineComments.update(body, userID, {
        afterUpdate: (new_data, old_data) => {
            normalUpdateHistoryForPost(new_data, old_data, 5, userID)
        }
    });
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
router.setAgs((ctx) => {
    const query = getQuery(ctx);
    return query.id;
}, getUserID);
router.delete('/lines/comments', async (id, userID) => {
    await projectLineComments.del(id, userID);
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
router.setAgs(getQuery)
router.get('/history', async (query) => {
    return await projectHistory.search(query);
})

// 项目历史结束

// 項目郵件設置開始
apiDescriptionGroup.add({
    tip: '获得项目管理的邮件通知设置',
    results: [{
        code: 200,
        fromTable: 'moa_project_mail_setting',
        dataIsArray: true
    }]
});
router.setAgs(1)
router.get('/settings/mails', async () => {
    return await projectMailSetting.search();
})

apiDescriptionGroup.add({
    tip: '更新或插入项目管理的邮件通知设置',
    bodyFromTable: 'moa_project_mail_setting',
    results: [{
        code: 200,
        data: `number`
    }]
});
router.setAgs(getBody, getUserID);
router.post('/settings/mails', async (body, userID) => {
    return await projectMailSetting.update(body, userID);
})

apiDescriptionGroup.add({
    tip: '删除项目管理的邮件通知设置',
    params: [{
        name: 'id',
        type: '设置id',
        example: '5'
    }],
    results: [{
        code: 200,
        data: ''
    }]
});
router.setAgs((ctx) => {
    const query = getQuery(ctx);
    return query.id;
}, getUserID);
router.delete('/settings/mails', async (id, userID) => {
    await projectMailSetting.del(id, userID);
})


// 項目郵件設置結束

module.exports = router;