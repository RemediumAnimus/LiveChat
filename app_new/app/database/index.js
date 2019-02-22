'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
var config 	= require('../config');
var mysql 	= require('mysql');

/**
 * TITLE        : Database method
 * DESCRIPTION  : Initialize sitting`s from database
 *
 */
var init = function() {

    // Connect to the database
    var pool = mysql.createPool({
        database: config.db.name,
        host: config.db.host,
        user: config.db.username,
        password: config.db.password
    });

    // Throw an error if the connection fails
    pool.getConnection(function (err, connection) {
        if (err) throw err;
    });

    return pool;
}

module.exports = init();

