'use strict';

const mysql  = require('../database');
const sql    = require('sqlstring');
const config = require('../config');

/**
 * Creates a new message
 *
 */
const save = function (from_id, room_id, type, body, upload_id, stack_id, done) {

    let queryString = 'INSERT INTO messages (`from_id`,       ' +
        '                                    `room_id`,       ' +
        '                                    `stack_id`,      ' +
        '                                    `type`,          ' +
        '                                    `body`)          ' +
        'VALUES                             (?, ?, ?, ?, ?)   ' ;

    if(type !== config.chat.messages.type.text)
    {
        body = null;
    }

    mysql.query(sql.format(queryString, [from_id, room_id, stack_id, type, body]), function(err, result){
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
        '                       m.`stack_id`,           ' +
        '                       m.`datetime`,           ' +
        '                       m.`is_read`,            ' +
        '                       u.`id`      u_id,       ' +
        '                       u.`name`    u_name,     ' +
        '                       u.`roles`   u_roles,    ' +
        '                       up.`id`     up_id ,     ' +
        '                       up.`original_name`,     ' +
        '                       up.`name`,              ' +
        '                       up.`type`   up_type,    ' +
        '                       up.`ext`                ' +
        'FROM   messages m                              ' +
        'INNER  JOIN users u ON m.from_id = u.id        ' +
        'LEFT   JOIN uploads up ON m.id = up.id_message ' +
        'WHERE  room_id = ? ORDER BY m.stack_id         ' ;

    mysql.query(sql.format(queryString, [room_id]), function(err, result){
        if (err)
            return done(err);
        if (!result)
            return done(null, false);
        if(result.length === 0)
            return done(null, false);

        let object = [];

        for(let i = 0; i < result.length; i++) {

            if(i > 0 && object[object.length - 1].message.stack === result[i].stack_id) {
                if(result[i].type !== config.chat.messages.type.text) {
                    object[object.length - 1].message.upload.push({ id              : result[i].up_id,
                                                                    id_message      : result[i].id_message,
                                                                    original_name   : result[i].original_name,
                                                                    name            : result[i].name,
                                                                    type            : result[i].up_type,
                                                                    ext             : result[i].ext });
                }
                else {
                    object[object.length - 1].message.body = result[i].body;
                }

                continue;
            }

            object[i]                       = {};
            object[i].user                  = {};
            object[i].user.id               = result[i].u_id;
            object[i].user.name             = result[i].u_name;
            object[i].user.roles            = result[i].u_roles;

            object[i].message               = {};
            object[i].message.upload        = [];
            object[i].message.id            = result[i].id;
            object[i].message.body          = result[i].body;
            object[i].message.type          = result[i].type;
            object[i].message.stack         = result[i].stack_id;
            object[i].message.is_read       = result[i].is_read;

            if(result[i].type !== config.chat.messages.type.text) {
                object[i].message.upload.push({ id              : result[i].up_id,
                                                id_message      : result[i].id,
                                                original_name   : result[i].original_name,
                                                name            : result[i].name,
                                                type            : result[i].up_type,
                                                ext             : result[i].ext });
            }
        }

        object = object.filter(function (el) {
            return el != null;
        });

        return done(null, object);
    });
}

/**
 * Gets message type
 *
 */
const type = function (type) {

    switch(type) {
        case config.chat.messages.type.text:
            type = config.chat.messages.type.text;
            break;
        default: type.match(/image.*/)
                    ? type = "image"
                    : type = "document";
            break;
    }

    return type;
}

module.exports = {
    save,
    get,
    type
};