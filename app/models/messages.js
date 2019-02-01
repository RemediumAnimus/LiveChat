'use strict';

const mysql = require('../database');
const sql   = require('sqlstring');

/**
 * Creates a new message
 *
 */
const save = function (from_id, room_id, type, body, upload_id, done) {

    let queryString = 'INSERT INTO messages (`from_id`,       ' +
        '                                    `room_id`,       ' +
        '                                    `type`,          ' +
        '                                    `body`)          ' +
        'VALUES                             (?, ?, ?, ?)      ' ;

    mysql.query(sql.format(queryString, [from_id, room_id, type, body]), function(err, result){
        if (err)
            return done(err);
        if (!result.insertId) {
            return done(null, false);
        }

        if(upload_id) {

            let queryStringAdd = 'UPDATE uploads ' +
            'SET    id_message = ? ' +
            'WHERE  id = ?';

            mysql.query(sql.format(queryStringAdd, [result.insertId, upload_id]), function(err, result){
                if (err)
                    return done(err);
                if (!result.insertId) {
                    return done(null, false);
                }
            });
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

    let queryString = 'SELECT   m.`id`,                 ' +
        '                       m.`body`,               ' +
        '                       m.`type`,               ' +
        '                       m.`datetime`,           ' +
        '                       m.`is_read`,            ' +
        '                       u.`id`      u_id,       ' +
        '                       u.`name`    u_name,     ' +
        '                       u.`roles`   u_roles,    ' +
        '                       up.`id`     up_id ,     ' +
        '                       up.`original_name`,     ' +
        '                       up.`name`,              ' +
        '                       up.`type`,              ' +
        '                       up.`ext`                ' +
        'FROM   messages m                              ' +
        'INNER  JOIN users u ON m.from_id = u.id        ' +
        'LEFT   JOIN uploads up ON m.id = up.id_message ' +
        'WHERE  room_id = ? ORDER BY m.id               ' ;

    mysql.query(sql.format(queryString, [room_id]), function(err, result){
        if (err)
            return done(err);
        if (!result)
            return done(null, false);
        if(result.length === 0)
            return done(null, false);

        let object = [];

        for(let i = 0, j = 0; i < result.length; i++) {

            /*if(j && object[object.length - 1].message.id === result[i].id) {
                object[object.length - 1].message.attachments.push({id              : result[i].up_id,
                                                                    id_message      : result[i].id_message,
                                                                    original_name   : result[i].original_name,
                                                                    name            : result[i].name,
                                                                    type            : result[i].type,
                                                                    ext             : result[i].ext});
                continue;
            }*/

            object[j]                       = {};
            object[j].user                  = {};
            object[j].user.id               = result[i].u_id;
            object[j].user.name             = result[i].u_name;
            object[j].user.roles            = result[i].u_roles;

            object[j].message               = {};
            object[j].message.id            = result[i].id;
            object[j].message.body          = result[i].body;
            object[j].message.type          = result[i].type;
            object[j].message.is_read       = result[i].is_read;

            if(result[i].up_id) {
                object[j].message.upload    = { id              : result[i].up_id,
                                                id_message      : result[i].id,
                                                original_name   : result[i].original_name,
                                                name            : result[i].name,
                                                type            : result[i].type,
                                                ext             : result[i].ext };
            }

            j++;

            if(j === result.length) {
                return done(null, object);
            }
        }
    });
}

module.exports = {
    save,
    get
};