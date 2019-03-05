'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const mysql      = require('../database');
const sql        = require('sqlstring');

const Messages   = require('../models/messages');
const Users      = require('../models/users');
const Uploads    = require('../models/uploads');
const filesize   = require('filesize');
const config     = require('../config');

/**
 * TITLE        : Planners method
 * DESCRIPTION  : Creates a new task
 *
 */
const save = function (user_id, operator_id, header, description, comment, date_end, type_id, selected, done){

    let queryString = 'INSERT INTO planners (`user_id`,            ' +
        '                                   `operator_id`,         ' +
        '                                   `header`,              ' +
        '                                   `description`,         ' +
        '                                   `comment`,             ' +
        '                                   `data_end`,            ' +
        '                                   `type_id`)             ' +
        'VALUES                             (?, ?, ?, ?, ?, ?, ?)  ' ;

    mysql.query(sql.format(queryString, [user_id, operator_id, header, description, comment, date_end, type_id]), function(err, result){

        if (err)
            return done(err);
        if (!result.insertId) {
            return done(null, false);
        }

        let object              = {};
            object.id           = result.insertId;
            object.user_id      = user_id;
            object.operator_id  = operator_id;
            object.header       = header;
            object.description  = description;
            object.comment      = comment;
            object.data_create  = Uploads.formatdate(new Date(), true);
            object.data_end     = Uploads.formatdate(new Date(date_end), true);
            object.type_id      = type_id;
            object.whose        = 1;
            object.progress     = 0;
            object.status       = 1;

        if(!selected.length) {

            // All is well, return successful
            return done(null, object);
        }

        let string = '';

        for(let i = 0; i < selected.length; i++) {
            string += '('+result.insertId+', '+selected[i]+')';

            if(i < selected.length - 1) {
                string += ', ';
            }
        }

        queryString = 'INSERT INTO planner_messages (`id_planner`,  ' +
        '                                            `id_stack`)    ' +
        'VALUES                                      '+string+'     ' ;

        mysql.query(queryString, function(err) {
            if (err)
                return done(err);

            // All is well, return successful
            return done(null, object);
        });
    });
}

const list = function (user_id, room_id, type, done) {

    /**
     * TITLE        : Planners method
     * DESCRIPTION  : Get list planners
     *
     */
    let queryString = 'SELECT   p.`id`,                   ' +
        '                       p.`header`,               ' +
        '                       p.`description`,          ' +
        '                       p.`data_create`,          ' +
        '                       p.`data_end`,             ' +
        '                       p.`whose`,                ' +
        '                       p.`status`                ' +
        'FROM   planners p                                ' +
        'WHERE  p.user_id = ? AND p.whose = ?             ' +
        'ORDER  BY p.id DESC                              ' +
        'LIMIT  20                                        ' ;

    let objectArr  = [],
        objectCnt  = 0;

    const get = function(i) {

        mysql.query(sql.format(queryString, [user_id, type[i]]), function (err, result) {

            objectArr[i] = {};
            objectArr[i].complete   = [];
            objectArr[i].incomplete = [];

            if(result.length) {

                for (let j = 0; j < result.length; j++) {

                    result[j].data_create = Uploads.formatdate(result[j].data_create, true);
                    result[j].data_end    = Uploads.formatdate(result[j].data_end, true);

                    if (result[j].status === 3) {
                        objectArr[objectCnt].complete.push(result[i]);
                        objectArr[objectCnt].complete[objectArr[objectCnt].complete.length - 1].comment = [];
                        continue;
                    }

                    objectArr[i].incomplete.push(result[j]);
                    objectArr[objectCnt].incomplete[objectArr[objectCnt].incomplete.length - 1].comment = [];
                }
            }

            objectCnt++;

            if(objectCnt < type.length) {
                get(objectCnt);
            }
            else {
                done(null, objectArr);
            }
        })
    }

    get(0);
}

/**
 * TITLE        : Planners method
 * DESCRIPTION  : Get list planners
 *
 */
const download = function (user_id, room_id, type, offset, done){

    let queryString = 'SELECT   p.`id`,                   ' +
        '                       p.`user_id`,              ' +
        '                       p.`operator_id`,          ' +
        '                       p.`type_id`,              ' +
        '                       p.`header`,               ' +
        '                       p.`data_create`,          ' +
        '                       p.`data_end`,             ' +
        '                       p.`whose`,                ' +
        '                       p.`progress`,             ' +
        '                       p.`status`                ' +
        'FROM   planners p                                ' +
        'WHERE  p.user_id = ? AND p.whose = ?             ' +
        'LIMIT 10 OFFSET ?                                ' +
        'ORDER BY p.id DESC                               ' ;

    mysql.query(sql.format(queryString, [user_id, type, offset]), function(err, result){

        if (err)
            return done(err);
        if (!result.length) {
            return done(null, false);
        }

        let list            = {};
            list.complete   = [];
            list.incomplete = [];

        for (let i = 0; i < result.length; i++){

            result[i].data_create = Uploads.formatdate(result[i].data_create, true);

            if(result[i].status === 3) {
                list.complete.push(result[i]);
                list.complete[list.complete.length - 1].comment = [];
                continue;
            }

            list.incomplete.push(result[i]);
            list.incomplete[list.incomplete.length - 1].comment = [];
        }

        // All is well, return successful
        return done(null, list);
    });
}

const getComment = function(id, room_id, offset, done) {

    let object      = [],
        queryString = 'SELECT   m.`id`,                         ' +
            '                       m.`from_id`,                    ' +
            '                       m.`planner_id`,                 ' +
            '                       m.`body`,                       ' +
            '                       m.`type`,                       ' +
            '                       m.`category`,                   ' +
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
            '                       up.`ext`,                       ' +
            '                       p.`id`  pl_id,                  ' +
            '                       p.`header`  pl_header,          ' +
            '                       p.`description` pl_description, ' +
            '                       p.`data_create` pl_data_create, ' +
            '                       p.`data_end` pl_data_end,       ' +
            '                       p.`whose` pl_whose,             ' +
            '                       p.`status` pl_status            ' +
            'FROM   messages m                                      ' +
            'INNER  JOIN users u ON m.from_id = u.id                ' +
            'INNER  JOIN planners p ON m.planner_id = p.id          ' +
            'LEFT   JOIN uploads up ON m.id = up.id_message         ' +
            'WHERE  p.id = ? AND m.category = ?                     ' +
            'ORDER  BY m.id DESC, m.stack_id                        ' +
            'LIMIT  5 OFFSET ?                                     ' ;

   mysql.query(sql.format(queryString, [id, 'comment', offset]), function(err, result) {

        if(err)
            return done (err, null);
        if(!result.length)
            return done (err, null);

        for(let i = 0, objectPrev, objectMessagePrev; i < result.length; i++) {

            // Format date string
            result[i].datetime = Messages.time(result[i].datetime);

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
                        thumb           : Messages.getPath(room_id, result[i].name, result[i].ext),
                        thumb_xs        : result[i].name_xs
                                        ? Messages.getPath(room_id, result[i].name_xs, result[i].ext)
                                        : result[i].name_xs,
                        thumb_sm        : result[i].name_sm
                                        ? Messages.getPath(room_id, result[i].name_sm, result[i].ext)
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

            /*if(i > 0 && objectPrev.collection[objectMessagePrev].upload.length === 0) {

                if(result[i].from_id === objectPrev.collection[objectMessagePrev].from_id) {

                    if(result[i].type === config.chat.messages.type.text) {

                        objectPrev.collection.push({
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

                        objectPrev.collection[0].upload.push({
                            id              : result[i].up_id,
                            type            : result[i].up_type,
                            size            : filesize(result[i].up_size),
                            original_name   : result[i].original_name,
                            thumb           : Messages.getPath(room_id, result[i].name, result[i].ext),
                            thumb_xs        : result[i].name_xs
                                            ? Messages.getPath(room_id, result[i].name_xs, result[i].ext)
                                            : result[i].name_xs,
                            thumb_sm        : result[i].name_sm
                                            ? Messages.getPath(room_id, result[i].name_sm, result[i].ext)
                                            : result[i].name_sm
                        });

                        continue;
                    }
                }
            }*/

            // Create`s an object
            object[i]                       = {};
            object[i].user                  = {};
            object[i].user.id               = result[i].u_id;
            object[i].user.first_name       = result[i].u_first_name;
            object[i].user.last_name        = result[i].u_last_name;
            object[i].user.display_name     = Users.getReadbleName(result[i].u_first_name, result[i].u_last_name);
            object[i].user.short_name       = Users.getShortName(result[i].u_first_name, result[i].u_last_name);
            object[i].user.roles            = result[i].u_roles;
            object[i].collection            = [];

            object[i].collection.push({
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

                object[i].collection[object[i].collection.length - 1].upload.push({
                    id              : result[i].up_id,
                    type            : result[i].up_type,
                    size            : filesize(result[i].up_size),
                    original_name   : result[i].original_name,
                    thumb           : Messages.getPath(room_id, result[i].name, result[i].ext),
                    thumb_xs        : result[i].name_xs
                                    ? Messages.getPath(room_id, result[i].name_xs, result[i].ext)
                                    : result[i].name_xs,
                    thumb_sm        : result[i].name_sm
                                    ? Messages.getPath(room_id, result[i].name_sm, result[i].ext)
                                    : result[i].name_sm
                });
            }
        }
        // Remove`s null values
        object = object.filter(function (el) {
            return el != null;
        });

        return done(null, object)
   })
}

module.exports = {
    save,
    list,
    download,
    getComment
};