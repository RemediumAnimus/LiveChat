'use strict';

var config 		= require('../config');
var session 	= require('express-session');

/**
 * Initialize Session
 *
 */
var init = function () {
	return session({
		secret: config.sessionSecret,
		resave: false,
		unset: 'destroy',
		saveUninitialized: true
	});
}

module.exports = init();