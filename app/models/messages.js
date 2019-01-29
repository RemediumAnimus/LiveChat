'use strict';

const mysql = require('../database');
const sql   = require('sqlstring');

/**
 * Creates a new message
 *
 */
const save = function (from_id, room_id, body, attachments, done) {

    mysql.query(sql.format('INSERT INTO messages (`from_id`, `room_id`, `body`) VALUES (?, ?, ?)', [from_id, room_id, body]), function(err, result){
        if (err)
            return done(err);
        if (!result.insertId) {
            return done(null, false);
        }

        if(attachments.length) {
            mysql.query("UPDATE uploads SET id_message = "+result.insertId+" WHERE id IN("+attachments.join(",")+")")
        }

        // All is well, return successful
        return done(null, result.insertId);
    });
}

module.exports = {
    save
};