/**
 * Express based server
 * Which serves:
 * - frontend client code
 * - service for AVS device
 * - Alexa SKill
 */
const express = require('express');
const path = require('path');
const avsDevice = require('./avs-device');
const cookieParser = require('cookie-parser');
const alexaSkill = require('./alexa-skill');
const logger = require('./utils/logger');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const expressLogging = require('express-logging');
const staticFronend = require('./static-frontend');

const app = express();

/**
 * Log express requests
 */
app.use(expressLogging(logger));

/**
 * Use sessions
 */
app.use(session({
  store: new FileStore(),
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 },
}));

/**
 * Serve log file for quick debugging
 *
 * Only in dev mode. It's not safe to serve it in production
 * as it can contain sensitive data like access tokens,
 */
if (process.env.NODE_ENV === 'development') {
  app.get('/logs', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../server-verbose.log'));
  });
}

/**
 * Still will need to use cookies to make things simple
 */
app.use(cookieParser());

/**
 * Connect Alexa Skill to express
 */
alexaSkill(app);

/**
 * Serve AVS device service
 */
app.use(avsDevice);

/**
 * Serve static frontend
 */
staticFronend(app);

module.exports = app;
