const db = require('../../../../lib/oracleDB'),
    tableUtil = require('../../../../tables/share/util'),
    toStoreString = tableUtil.toStoreString;


function getCvteHeaders({
    line_id,
    part_no,
    wo_no
}) {
    line_id = +line_id;
    part_no = part_no ? part_no.toLocaleUpperCase() : '';
    wo_no = wo_no ? wo_no.toLocaleUpperCase() : '';
    part_no = toStoreString(part_no);
    wo_no = toStoreString(wo_no);
    return db.execute(`SELECT DISTINCT
                ${line_id} LINE_ID,
                SM.MODEL,
                SW.PART_NO,
                SW.WO_NO,
                SW.ID WO_ID
            FROM SFCS_SITE_STATISTICS@DBLINK_MISFCS_SFCS SS,
            SFCS_OPERATION_SITES@DBLINK_MISFCS_SFCS OS,
            SFCS_OPERATIONS@DBLINK_MISFCS_SFCS SO,
            SFCS_WO@DBLINK_MISFCS_SFCS SW,
            SFCS_MODEL@DBLINK_MISFCS_SFCS SM
            WHERE     SS.OPERATION_SITE_ID = OS.ID
            AND OS.OPERATION_LINE_ID = ${line_id}
            AND OS.OPERATION_ID = SO.ID
            AND SO.ID IN (883, 885, 886, 889, 3885)
            AND SS.WORK_TIME >= SYSDATE - 3 / 24
            AND SS.WORK_TIME <= SYSDATE
            AND SS.WO_ID = SW.ID
            AND SW.MODEL_ID = SM.ID
            AND (SW.PART_NO = ${part_no} or ${part_no} is null)
            AND (SW.WO_NO = ${wo_no} or ${wo_no} is null)`).then(res => res.rows);
}

function getCvteBody1({
    wo_id,
    line_id,
    op_id
}) {
    return db.execute(`SELECT ${op_id} OP_ID,
    (SELECT ROUND ( (SYSDATE - MIN (OPERATION_TIME)) * 24, 3)
       FROM SFCS_OPERATION_HISTORY@DBLINK_MISFCS_SFCS
      WHERE     WO_ID = ${wo_id} --3739089
            AND SITE_OPERATION_ID = ${op_id} --3885
            AND OPERATION_STATUS IN (1, 2))
       INPUT_TOTAL_HOURS,
    A.*,
    ROUND (A.OUTPUT_QTY / A.TARGET_QTY, 3) FINISH_RATE
FROM (  SELECT SW.TARGET_QTY, SUM (SS.PASS + SS.FAIL) OUTPUT_QTY
         FROM SFCS_SITE_STATISTICS@DBLINK_MISFCS_SFCS SS, SFCS_OPERATION_SITES@DBLINK_MISFCS_SFCS OS, SFCS_WO@DBLINK_MISFCS_SFCS SW
        WHERE     SS.OPERATION_SITE_ID = OS.ID
              AND SS.WO_ID = SW.ID
              AND SW.ID = ${wo_id}--3739089
              AND OS.OPERATION_LINE_ID = ${+line_id}--111877
              AND OS.OPERATION_ID = ${op_id}--3885
              AND (SS.PASS + SS.FAIL) > 0
     GROUP BY SW.TARGET_QTY) A`).then(res => res.rows).then((r) => {
        if (r.length === 0) {
            return [{
                OP_ID: op_id,
                INPUT_TOTAL_HOURS: '',
                TARGET_QTY: '',
                OUTPUT_QTY: '',
                FINISH_RATE: '',
                null: '',
            }]
        }
        return r.map(r => {
            if (r.FINISH_RATE > 0) {
                r.FINISH_RATE = (r.FINISH_RATE * 100).toFixed(2) + '%'
            }
            return r
        });
    });
}

function getCvteBody2({
    wo_id,
    line_id,
    op_id
}) {
    return db.execute(`SELECT A.WORK_TIME WORK_TIME,
    A.STANDARD_CAPACITY,
    A.CURRENT_HOUR_OUTPUT,
    ROUND (A.CURRENT_HOUR_OUTPUT / A.STANDARD_CAPACITY, 3) FINISH_RATE,
    A.FIRST_PASS_YIELD_RATE,
    FAIL_QTY
FROM (SELECT SS.WORK_TIME,
            (SELECT TO_NUMBER (NVL (TRIM (ATTRIBUTE1), 1))
               FROM SFCS_RULE_CONFIG@DBLINK_MISFCS_SFCS
              WHERE     PART_NO = SW.PART_NO
                    AND OPERATION_CODE = ${op_id}
                    AND RULE_ID = 3744879
                    AND ENABLED = 'Y'
                    AND ROWNUM = 1
             UNION
             SELECT 1
               FROM DUAL
              WHERE NOT EXISTS
                           (SELECT *
                              FROM SFCS_RULE_CONFIG@DBLINK_MISFCS_SFCS
                             WHERE     PART_NO = SW.PART_NO
                                   AND OPERATION_CODE = ${op_id}
                                   AND RULE_ID = 3744879
                                   AND ENABLED = 'Y'))
               STANDARD_CAPACITY,
            (SS.PASS + SS.FAIL) CURRENT_HOUR_OUTPUT,
            SS.PASS / (SS.PASS + SS.FAIL) FIRST_PASS_YIELD_RATE,
            SS.FAIL FAIL_QTY
       FROM SFCS_SITE_STATISTICS@DBLINK_MISFCS_SFCS SS, SFCS_OPERATION_SITES@DBLINK_MISFCS_SFCS OS, SFCS_WO@DBLINK_MISFCS_SFCS SW
      WHERE     SS.OPERATION_SITE_ID = OS.ID
            AND SS.WO_ID = SW.ID
            AND SW.ID = ${wo_id}                                    --3739089
            AND OS.OPERATION_LINE_ID = ${line_id}                    --111877
            AND OS.OPERATION_ID = ${op_id}                             --3885
            AND (SS.PASS + SS.FAIL) > 0
            AND SS.WORK_TIME >= SYSDATE - 3 / 24
            AND SS.WORK_TIME <= SYSDATE) A`).then(res => res.rows).then(r => r.map((l) => {
        if (l.FINISH_RATE > 0) {
            l.FINISH_RATE = (l.FINISH_RATE * 100).toFixed(0) + '%';
        }
        if (l.FIRST_PASS_YIELD_RATE > 0) {
            l.FIRST_PASS_YIELD_RATE = (l.FIRST_PASS_YIELD_RATE * 100).toFixed(0) + '%';
        }
        return l;
    }));
}
module.exports = {
    getCvteHeaders,
    getCvteBody1,
    getCvteBody2
}