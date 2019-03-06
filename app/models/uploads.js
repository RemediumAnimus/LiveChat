'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const mysql      = require('../database');
const sql        = require('sqlstring');
const filesize   = require('filesize');

const Messages   = require('../models/messages');

/**
 * TITLE        : Upload method
 * DESCRIPTION  : Creates a new uploads
 *
 */
const save = function (original_name, name, name_xs, name_sm, password, type, size, ext, done){

    let queryString = 'INSERT INTO uploads (`original_name`,        ' +
        '                                   `name`,                 ' +
        '                                   `name_xs`,              ' +
        '                                   `name_sm`,              ' +
        '                                   `password`,             ' +
        '                                   `type`,                 ' +
        '                                   `size`,                 ' +
        '                                   `ext`)                  ' +
        'VALUES                             (?, ?, ?, ?, ?, ?, ?, ?)' ;

    mysql.query(sql.format(queryString, [original_name, name, name_xs, name_sm, password, type, size, ext]), function(err, result){

        if (err)
            return done(err);
        if (!result.insertId) {
            return done(null, false);
        }

        // All is well, return successful
        return done(null, result.insertId);
    });
}

/**
 * TITLE        : Upload method
 * DESCRIPTION  : Receives not sent downloads
 *
 */
const get = function (password, room_id, done){

    let queryString = 'SELECT   u.`id`,                 ' +
        '                       u.`original_name`,      ' +
        '                       u.`name`,               ' +
        '                       u.`name_xs`,            ' +
        '                       u.`name_sm`,            ' +
        '                       u.`type`,               ' +
        '                       u.`size`,               ' +
        '                       u.`ext`                 ' +
        'FROM   uploads u                               ' +
        'WHERE  u.`password` = ?                        ' +
        'AND    u.`id_message` IS NULL                  ' ;

    mysql.query(sql.format(queryString, [password]), function(err, result){
        if (err)
            return done(err);
        if (!result)
            return done(null, false);

        for(let i = 0; i < result.length; i++) {
            result[i].thumb     = Messages.getPath(room_id, result[i].name, result[i].ext);
            result[i].thumb_xs  = result[i].name_xs
                                ? Messages.getPath(room_id, result[i].name_xs, result[i].ext)
                                : result[i].name_xs;
            result[i].thumb_sm  = result[i].name_sm
                                ? Messages.getPath(room_id, result[i].name_sm, result[i].ext)
                                : result[i].name_sm;
            result[i].size      = filesize(result[i].size);

            delete result[i].name;
            delete result[i].name_xs;
            delete result[i].name_sm;
            delete result[i].ext;
        }

        return done(null, result);
    });
}

/**
 * TITLE        : Upload method
 * DESCRIPTION  : Remove upload from DB
 *
 */
const remove = function (id, done){

    let queryString = 'SELECT   u.`id`,                 ' +
        '                       u.`name`,               ' +
        '                       u.`name_xs`,            ' +
        '                       u.`name_sm`,            ' +
        '                       u.`ext`                 ' +
        'FROM   uploads u                               ' +
        'WHERE  u.`id` = ?                              ' ;

    mysql.query(sql.format(queryString, [id]), function(err, result){

        if (err)
            return done(err);
        if (!result)
            return done(null, false);

        queryString = 'DELETE FROM uploads WHERE id = ?';

        mysql.query(sql.format(queryString, [id]), function(error, out){
            if (error)
                return done(error);
            if (!out)
                return done(null, false);
            return done(null, result);
        });
    });
}

/**
 * TITLE        : Upload method
 * DESCRIPTION  : Receives not sent downloads
 *
 */
const profile = function (room_id, type, offset, done){

    let queryString = 'SELECT   u.`id`,                 ' +
        '                       u.`original_name`,      ' +
        '                       u.`name`,               ' +
        '                       u.`name_xs`,            ' +
        '                       u.`name_sm`,            ' +
        '                       u.`type`,               ' +
        '                       u.`size`,               ' +
        '                       u.`ext`,                ' +
        '                       m.`datetime`            ' +
        'FROM   messages m                              ' +
        'INNER  JOIN uploads u ON u.id_message = m.id   ' +
        'WHERE  m.room_id = ?                           ' +
        'AND    m.type = ? ORDER BY m.id DESC           ' +
        'LIMIT  20 OFFSET ?                              ' ;

    mysql.query(sql.format(queryString, [room_id, type, offset]), function(err, result){
        if (err)
            return done(err);
        if (!result)
            return done(null, false);

        let object           = [];
            object.uploads   = [];

        for(let i = 0; i < result.length; i++) {

            result[i].thumb     = Messages.getPath(room_id, result[i].name, result[i].ext);
            result[i].thumb_xs  = result[i].name_xs
                                ? Messages.getPath(room_id, result[i].name_xs, result[i].ext)
                                : result[i].name_xs;
            result[i].thumb_sm  = result[i].name_sm
                                ? Messages.getPath(room_id, result[i].name_sm, result[i].ext)
                                : result[i].name_sm;
            result[i].size      = filesize(result[i].size);
            result[i].datetemp  = result[i].datetime;
            result[i].datetime  = formatdate(result[i].datetime);
            result[i].fulltime  = result[i].datetime + ' в ' + Messages.time(result[i].datetemp);

            delete result[i].name;
            delete result[i].name_xs;
            delete result[i].name_sm;
            delete result[i].ext;
            delete result[i].datetemp;

            if(i > 0 && result[i].datetime === object[object.length - 1].datetime) {

                object[object.length - 1].uploads.push(result[i]);

                continue;
            }

            object[i]           = {};
            object[i].uploads   = [];
            object[i].datetime  = result[i].datetime;

            delete result[i].datetime;

            object[i].uploads.push(result[i]);
        }

        // Remove`s null values
        object = object.filter(function (el) {
            return el != null;
        });

        return done(null, object);
    });
}


module.exports = {
    save,
    get,
    remove,
    profile
};