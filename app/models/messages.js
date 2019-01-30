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
            for(let i = 0; i < attachments.length; i++) {
                mysql.query(sql.format('UPDATE uploads SET id_message = ? WHERE id = ?', [result.insertId, attachments[i].id]))
            }
        }

        // All is well, return successful
        return done(null, result.insertId);
    });
}


/**
 * Receives messages for a specific room.
 *
 */
const get = function (room_id, done) {

    let query = 'SELECT m.`id`, m.`body`, m.`datetime`, u.`id` u_id, u.`name` u_name, u.`roles` u_roles '+
                'FROM messages m INNER JOIN users u ON m.from_id = u.id '+
                'WHERE room_id = ?';

    mysql.query(sql.format(query, [room_id]), function(err, result){
        if (err)
            return done(err);
        if (!result) {
            return done(null, false);
        }

        for(let i = 0, object = {}; i < result.length; i++) {

            object.message = {};
        }


        // All is well, return successful
        return done(null, result);
    });
}

module.exports = {
    save,
    get
};