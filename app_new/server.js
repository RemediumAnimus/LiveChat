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

/**
 * Chat application components
 *
 */
const routes 	 = require('./app/routes');
const session 	 = require('./app/session');
const passport   = require('./app/auth');
const ioServer 	 = require('./app/socket')(app);
const port       = process.env.PORT || 3001
const webpack    = require('webpack');
const middleware = require('webpack-dev-middleware');
const compiler   = webpack(require('./webpack.config'));

app.use(middleware(compiler, {
  publicPath : "/dist/"
}));

app.use(express.static(path.join(__dirname, "dist")));



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

app.use(fileUpload({useTempFiles : true,
    tempFileDir  : '/tmp/'}));


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

