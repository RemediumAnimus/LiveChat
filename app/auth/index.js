'use strict';

var config 		= require('../config');
var passport 	= require('passport');
var mysql 		= require('../database');

var LocalStrategy = require('passport-local').Strategy;

/**
 * Encapsulates all code for authentication 
 * Either by using username and password
 *
 */
var init = function(){

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        mysql.query("SELECT `id`, `name`, `roles`, `room` FROM `users` WHERE `id` = "+id,function(err,rows){
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
		mysql.query("SELECT `id`, `name`, `roles`, `room`, `password` FROM `users` WHERE `email` = '" + email + "'", function(err,rows){
			if (err)
				return done(err);
			if (!rows.length) {

                // req.flash is the way to set flashdata using connect-flash
				return done(null, false, req.flash('loginMessage', 'No user found.'));
			}

			// if the user is found but the password is wrong
			if (!(rows[0].password == password))

				// Create the loginMessage and save it to session as flashdata
				return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

			// All is well, return successful user
			return done(null, rows[0]);
		});
	}));

	return passport;
}

module.exports = init();