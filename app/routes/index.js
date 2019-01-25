'use strict';

var express	 = require('express');
var passport = require('passport');
var router 	 = express.Router();

var User     = require('../models/users');
var config   = require('../config');

/**
 * Home page
 * Redirects to the chat page if the user is logged in
 */
router.get('/', function(req, res, next) {

    // If user is already logged in, then redirect to chat page
    if(req.isAuthenticated()){
        res.redirect('/chat');
    }
    else {
        res.render('login');
    }
});

/**
 * Chat router
 * Sends data to an authorized user in the system.
 */
router.get('/chat', [User.isAuthenticated, function(req, res) {

    // Announces a template
    let template = '';

    // Checks user role
    switch(req.user.roles) {
        case config.chat.roles.operator:
            template = config.chat.template.operator;
            break;
        case config.chat.roles.client:
            template = config.chat.template.client;
            break;
    }

    // Generates a pattern
    res.render(template);
}]);

/**
 * Login user
 * Redirects to the chat page if the user is logged in
 */
router.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function (err, user, info) {
        if (err) {
            return res.status(401).json(err);
        }
        if (user) {
            req.logIn(user, function(err) {
                 if (err) {
                    return res.status(500).json({
                        err: 'Could not log in user!'
                    });
                }
                res.status(200).json({
                    status: 'Login successful!'
                });
            });
        } else {
            res.status(401).json(info);
        }
    })(req, res, next);
})

/**
 * Client route
 * Gets a list of users in the operators application.
 */
router.post('/users/list', function(req, res) {

    // Checks access to server chat
    User.isOperator(req, function(err) {
        if (err) {
            return res.status(403).json(err);
        }
    })

    // Gets a list of customers
    User.getByList(function(err, rows){
        if (err) {
            return res.status(401).json(err);
        }
        if(rows) {
            res.status(200).json(rows);
        }
        else {
            res.status(401).json(err);
        }
    })
})

/**
 * Users router
 * Redirects to the chat page if the user is logged in
 */
router.post('/users/get', function(req, res) {

    if(req.user) {
        return res.status(200).json(req.user);
    }
    else {
        return res.status(401).json('Data not received');
    }
})

module.exports = router;