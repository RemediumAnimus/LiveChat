'use strict';

const mysql = require('../database');
const sql   = require('sqlstring');

/**
 * Creates a new uploads
 *
 */
const save = function (original_name, name, password, type, ext, done){

    let queryString = 'INSERT INTO uploads (`original_name`,        ' +
        '                                   `name`,                 ' +
        '                                   `password`,             ' +
        '                                   `type`,                 ' +
        '                                   `ext`)                  ' +
        'VALUES                             (?, ?, ?, ?, ?)         ' ;

    mysql.query(sql.format(queryString, [original_name, name, password, type, ext]), function(err, result){

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
 * Receives not sent downloads
 *
 */
const get = function (password, done){

    let queryString = 'SELECT   u.`id`,                 ' +
        '                       u.`original_name`,      ' +
        '                       u.`name`,               ' +
        '                       u.`type`,               ' +
        '                       u.`ext`                 ' +
        'FROM   uploads u                               ' +
        'WHERE  u.`password` = ?                        ' +
        'AND    u.`id_message` IS NULL                  ' ;

    mysql.query(sql.format(queryString, [password]), function(err, result){
        if (err)
            return done(err);
        if (!result)
            return done(null, false);
        return done(null, result);
    });
}

module.exports = {
    save,
    get
};