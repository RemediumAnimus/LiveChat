'use strict';

const mysql = require('../database');
const sql   = require('sqlstring');

/**
 * Creates a new uploads
 *
 */
const save = function (original_name, name, password, type, ext, done){
    mysql.query(sql.format('INSERT INTO uploads (`original_name`, `name`, `password`, `type`, `ext`) VALUES (?, ?, ?, ?, ?)', [original_name, name+'_original', password, type, ext]), function(err, result){

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
    mysql.query(sql.format('SELECT * FROM uploads WHERE `password` = ? AND id_message IS NULL', [password]), function(err, result){
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