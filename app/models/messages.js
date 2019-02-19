'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const mysql     = require('../database');
const sql       = require('sqlstring');
const config    = require('../config');
const users     = require('../models/users');
const fs        = require('fs');
const filesize  = require('filesize');

/**
 * TITLE        : Message method
 * DESCRIPTION  : Creates a new message
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
 * TITLE        : Message method
 * DESCRIPTION  : Receives messages for a specific room
 *
 */
const get = function (room_id, offset, done) {

    let queryString = 'SELECT   m.`id`,                         ' +
        '                       m.`from_id`,                    ' +
        '                       m.`body`,                       ' +
        '                       m.`type`,                       ' +
        '                       m.`stack_id`,                   ' +
        '                       m.`datetime`,                   ' +
        '                       m.`is_read`,                    ' +
        '                       u.`id`      u_id,               ' +
        '                       u.`first_name` u_first_name,    ' +
        '                       u.`last_name`  u_last_name,     ' +
        '                       u.`company`  u_company,         ' +
        '                       u.`roles`   u_roles,            ' +
        '                       up.`id`     up_id ,             ' +
        '                       up.`original_name`,             ' +
        '                       up.`name`,                      ' +
        '                       up.`name_xs`,                   ' +
        '                       up.`name_sm`,                   ' +
        '                       up.`type`   up_type,            ' +
        '                       up.`size`   up_size,            ' +
        '                       up.`ext`                        ' +
        'FROM   messages m                                      ' +
        'INNER  JOIN users u ON m.from_id = u.id                ' +
        'LEFT   JOIN uploads up ON m.id = up.id_message         ' +
        'WHERE  room_id = ? ORDER BY m.id DESC, m.stack_id      ' +
        'LIMIT 10 OFFSET ?                                      ' ;

    mysql.query(sql.format(queryString, [room_id, offset]), function(err, result){
        if (err)
            return done(err);
        if (!result)
            return done(null, false);
        if(result.length === 0)
            return done(null, false);

        let object = [];

        for(let i = 0, objectPrev, objectMessagePrev; i < result.length; i++) {

            // Format date string
            result[i].datetime = time(result[i].datetime);

            if(i > 0) {
                objectPrev          = object[object.length - 1],
                objectMessagePrev   = objectPrev.collection.length - 1;
            }

            // If an object with such a stack exists in the array

            if(i > 0 && objectPrev.collection[objectMessagePrev].stack_id === result[i].stack_id) {

                if(result[i].type !== config.chat.messages.type.text) {

                    objectPrev.collection[objectMessagePrev].upload.unshift({
                        id              : result[i].up_id,
                        type            : result[i].up_type,
                        size            : filesize(result[i].up_size),
                        original_name   : result[i].original_name,
                        thumb           : getPath(room_id, result[i].name, result[i].ext),
                        thumb_xs        : result[i].name_xs
                                        ? getPath(room_id, result[i].name_xs, result[i].ext)
                                        : result[i].name_xs,
                        thumb_sm        : result[i].name_sm
                                        ? getPath(room_id, result[i].name_sm, result[i].ext)
                                        : result[i].name_sm
                    });
                }
                else {

                    objectPrev.collection[objectMessagePrev].id        = result[i].id;
                    objectPrev.collection[objectMessagePrev].body      = result[i].body;
                    objectPrev.collection[objectMessagePrev].type      = result[i].type;
                    objectPrev.collection[objectMessagePrev].stack_id  = result[i].stack_id;
                    objectPrev.collection[objectMessagePrev].is_read   = result[i].is_read;
                }

                continue;
            }

            if(i > 0 && objectPrev.collection[objectMessagePrev].upload.length === 0) {

                if(result[i].from_id === objectPrev.collection[objectMessagePrev].from_id) {

                    if(result[i].type === config.chat.messages.type.text) {

                        objectPrev.collection.unshift({
                            id          : result[i].id,
                            from_id     : result[i].from_id,
                            datetime    : result[i].datetime,
                            body        : result[i].body,
                            type        : result[i].type,
                            stack_id    : result[i].stack_id,
                            is_read     : result[i].is_read,
                            upload      : []
                        });

                        continue;
                    }
                    else {

                        objectPrev.collection[0].upload.unshift({
                            id              : result[i].up_id,
                            type            : result[i].up_type,
                            size            : filesize(result[i].up_size),
                            original_name   : result[i].original_name,
                            thumb           : getPath(room_id, result[i].name, result[i].ext),
                            thumb_xs        : result[i].name_xs
                                            ? getPath(room_id, result[i].name_xs, result[i].ext)
                                            : result[i].name_xs,
                            thumb_sm        : result[i].name_sm
                                            ? getPath(room_id, result[i].name_sm, result[i].ext)
                                            : result[i].name_sm
                        });

                        continue;
                    }
                }
            }

            // Create`s an object
            object[i]                       = {};
            object[i].user                  = {};
            object[i].user.id               = result[i].u_id;
            object[i].user.first_name       = result[i].u_first_name;
            object[i].user.last_name        = result[i].u_last_name;
            object[i].user.display_name     = users.getReadbleName(result[i].u_first_name, result[i].u_last_name);
            object[i].user.short_name       = users.getShortName(result[i].u_first_name, result[i].u_last_name);
            object[i].user.roles            = result[i].u_roles;
            object[i].collection            = [];

            object[i].collection.unshift({
                id              : result[i].id,
                from_id         : result[i].from_id,
                datetime        : result[i].datetime,
                body            : result[i].body,
                type            : result[i].type,
                stack_id        : result[i].stack_id,
                is_read         : result[i].is_read,
                upload          : []
            });

            if(result[i].type !== config.chat.messages.type.text) {

                object[i].collection[object[i].collection.length - 1].upload.unshift({
                    id              : result[i].up_id,
                    type            : result[i].up_type,
                    size            : filesize(result[i].up_size),
                    original_name   : result[i].original_name,
                    thumb           : getPath(room_id, result[i].name, result[i].ext),
                    thumb_xs        : result[i].name_xs
                                    ? getPath(room_id, result[i].name_xs, result[i].ext)
                                    : result[i].name_xs,
                    thumb_sm        : result[i].name_sm
                                    ? getPath(room_id, result[i].name_sm, result[i].ext)
                                    : result[i].name_sm
                });
            }
        }

        // Remove`s null values
        object = object.filter(function (el) {
            return el != null;
        });

        return done(null, object);
    });
}

/**
 * TITLE        : User method
 * DESCRIPTION  : Update message
 *
 */
const updateReadAll = function (from_id, update_from) {
    if (!update_from) {
        let queryString = 'UPDATE messages AS m  ' +
            'SET    m.`is_read` = 1              ' +
            'WHERE  m.`is_read` = 0              ' +
            'AND    m.`from_id` <> ?             ' ;

        mysql.query(sql.format(queryString, from_id));
    } else {
        let queryString = 'UPDATE messages AS m  ' +
            'SET    m.`is_read` = 1              ' +
            'WHERE  m.`is_read` = 0              ' +
            'AND    m.`from_id` = ?              ' ;

        mysql.query(sql.format(queryString, from_id));
    }
}

/**
 * Update messages is_read
 */
const update_read = function (ids_message, done) {
    let queryString =
        'UPDATE messages        ' +
        'SET    is_read = 1     ' +
        'WHERE  id in (?)       ' ;

    mysql.query(sql.format(queryString, [ids_message]));
}
/**
 * Gets message type
=======
 * TITLE        : Message method
 * DESCRIPTION  : Get`s message type
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

/**
 * TITLE        : Message method
 * DESCRIPTION  : Get`s message datetime format(H:m)
 *
 */
const time = function (datetime) {

    return ("0" + datetime.getHours()).slice(-2) + ':' + ("0" + datetime.getMinutes()).slice(-2);
}

/**
 * TITLE        : Message method
 * DESCRIPTION  : Get`s path
 *
 */
const getPath = function (room_id, name, ext) {

    return config.path.uploadView+room_id+'/'+name+ext
}

/**
 * TITLE        : Message method
 * DESCRIPTION  : Get`s path for remove file
 *
 */
const getPathRemove = function (room_id, name, ext) {

    return 'upload/'+room_id+'/'+name+ext;
}



module.exports = {
    save,
    get,
    type,
    update_read,
    time,
    getPath,
    getPathRemove,
    updateReadAll
};