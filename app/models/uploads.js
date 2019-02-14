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

module.exports = {
    save,
    get,
    remove
};