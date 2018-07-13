const db = require("../../../../lib/oracleDB"),
    tableUtil = require("../../../../tables/share/util");

module.exports = {
    prepare_task_new_assignee_mail(person, id) {
        return db.execute(`
        BEGIN
        MOA_MAIL_PKG.PROJECT_TASK_NEW_ASSIGNEE(${tableUtil.toStoreString(person)},${+id});
        END;`,
            true)
    },
    prepare_task_old_assignee_mail(person, id) {
        return db.execute(`
        begin
        MOA_MAIL_PKG.PROJECT_TASK_OLD_ASSIGNEE(${tableUtil.toStoreString(person)},${+id});
        end;`, true)
    },
    prepare_task_assignee_reject(person, id) {
        return db.execute(`
        begin
        MOA_MAIL_PKG.PROJECT_TASK_ASSIGNEE_REJECT(${tableUtil.toStoreString(person)},${+id});
        end;`, true)
    }
}