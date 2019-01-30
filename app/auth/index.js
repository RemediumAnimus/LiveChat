'use strict';

const config 	 = require('../config');
const passport 	 = require('passport');
const mysql 	 = require('../database');
const sql        = require('sqlstring');
const crypto     = require('crypto');

const LocalStrategy = require('passport-local').Strategy;

/**
 * Encapsulates all code for authentication 
 * Either by using username and password
 *
 */
const init = function(){

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        mysql.query(sql.format('SELECT u.`id`, u.`name`, u.`roles`, r.`id` AS `room` FROM `users` u LEFT JOIN `rooms` r ON u.id = r.id_user WHERE u.`id` = ?', [id]), function(err, rows){
            done(err, rows[0]);
        });
    });

    // We are using named strategies since we have one for login and one for signup
	passport.use('local-login', new LocalStrategy({
		usernameField : 'username',
		passwordField : 'password',
		passReqToCallback : true
	},
    // Callback with email and password from our form
	function(req, email, password, done) {
		mysql.query(sql.format('SELECT u.`id`, u.`name`, u.`roles`, r.`id` AS `room`, u.`password` FROM `users` u LEFT JOIN `rooms` r ON u.id = r.id_user WHERE u.`email` = ?', [email]), function(err, rows){
			if (err)
				return done(err);
			if (!rows.length) {

                // req.flash is the way to set flashdata using connect-flash
				return done(null, false, req.flash('loginMessage', 'No user found.'));
			}

			// if the user is found but the password is wrong
			if (!(rows[0].password === crypto.createHmac('sha256', String(password)).digest('hex')))

				// Create the loginMessage and save it to session as flashdata
				return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

			if(rows[0].room === null)

				delete(rows[0].room);

			// All is well, return successful user
			return done(null, rows[0]);
		});
	}));

	return passport;
}

module.exports = init();