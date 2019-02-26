'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const mysql      = require('../database');
const sql        = require('sqlstring');

const Messages   = require('../models/messages');

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

        if(!selected.length) {

            // All is well, return successful
            return done(null, result.insertId);
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
            return done(null, result.insertId);
        });
    });
}

module.exports = {
    save
};