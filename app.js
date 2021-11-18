const express = require('express');
const path = require('path');
const expressValidator = require('express-validator');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const httpStatus = require('http-status');
const LocalStrategy = require('passport-local').Strategy;
const config = require('./src/config/config');
const morgan = require('./src/config/morgan');
const logger = require('./src/config/logger');
const routes = require('./src/routes');
const user = require('./src/models/users');
const ApiError = require('./src/utils/ApiError');

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
// app.use(express.static(path.join(__dirname, 'public')));
// app.use('/admin', express.static(path.join(__dirname, 'public')));
// app.use('/user', express.static(path.join(__dirname, 'public')));
app.use('/', express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));
app.use('/filedocument', express.static('filedocument'));
app.use('/fileexcel', express.static('fileexcel'));
app.use('/latex.js-0.12.4', express.static('latex.js-0.12.4'));

// Express-session-middleware
app.use(
  session({
    secret: 'code-race-session',
    resave: true,
    saveUninitialized: true,
  }),
);

// Express-validator-middleware
app.use(
  expressValidator({
    errorFormatter(param, msg, value) {
      const namespace = param.split('.');
      const root = namespace.shift();
      let formParam = root;

      while (namespace.length) {
        formParam += `[${namespace.shift()}]`;
      }
      return {
        param: formParam,
        msg,
        value,
      };
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

/** GET: Setting global variable for the logged in user */
app.get('*', (req, res, next) => {
  res.locals.user = req.user || null;
  logger.info(`User: ${res.locals.user}`);
  next();
});

// api routes
app.use('/', routes);
// app.use('/user', usersRoute);
// app.use('/admin', enforceAuthentication(true, true), adminRoute);
// app.use('/admin', adminRoute);

/** Display page when error 404: page not found occur */
app.use((req, res, next) => {
  res.render('pages/404');
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

module.exports = app;

// Init Server
// initDatabase()
//   .then(() => console.log('MongoDB connecting succeeded'))
//   .then(() => bootServer())
//   .catch(err => {
//     console.log(err);
//     process.exit(1);
//   });
