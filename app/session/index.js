'use strict';

const config 	= require('../config');
const session 	= require('express-session');

/**
 * TITLE        : Session
 * DESCRIPTION  : Initialize Session
 *
 */
const init = function () {
	return session({
		secret: config.sessionSecret,
		resave: false,
		unset: 'destroy',
		saveUninitialized: true
	});
}

module.exports = init();