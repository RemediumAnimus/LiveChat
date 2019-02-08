'use strict';

/**
 * Chat application dependencies
 *
 */
const express       = require('express')
const app           = express()
const path          = require('path')
const bodyParser    = require('body-parser');
const flash 		= require('connect-flash');
const fileUpload    = require('express-fileupload');
const addRequestId  = require('express-request-id')();
const morgan        = require('morgan');
const logger        = require('./app/logger');

/**
 * Chat application components
 *
 */
const routes 	= require('./app/routes');
const session 	= require('./app/session');
const passport  = require('./app/auth');
const ioServer 	= require('./app/socket')(app);
const port      = process.env.PORT || 3000
/**
 * View engine setup
 *
 */
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');

/**
 * Middlewares
 *
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.use('/static', express.static('public'));

app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(fileUpload());
app.use(addRequestId);

function logs() {
    morgan.token('id', function getId(req) {
        return req.id
    });

    var loggerFormat = ':id [:date[web]] ":method :url" :status :response-time';

    app.use(morgan(loggerFormat, {
        skip: function (req, res) {
            //return res.statusCode < 400
        },
        stream: process.stderr
    }));

    app.use(morgan(loggerFormat, {
        skip: function (req, res) {
            return res.statusCode >= 400
        },
        stream: process.stdout
    }));

    app.use((req, res, next) => {
        var log = logger.loggerInstance.child({
            id: req.id,
            body: req.body
        }, true)
        /*log.info({
            req: req
        })*/
        next();
    });

    app.use(function (req, res, next) {
        function afterResponse() {
            res.removeListener('finish', afterResponse);
            res.removeListener('close', afterResponse);
            var log = logger.loggerInstance.child({
                id: req.id
            }, true)
            //log.info({res:res}, 'response')
        }

        res.on('finish', afterResponse);
        res.on('close', afterResponse);
        next();
    });
}

//logs();


/**
 * Routes
 *
 */
app.use('/', routes);

/**
 * Middleware to catch 404 error
 *
 */
app.use(function(req, res, next) {
    res.status(404).sendFile(process.cwd() + '/app/views/404.htm');
});

ioServer.listen(port, () => {
    console.log(`Server has been started on port ${port}...`)
})
