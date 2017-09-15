/**
 * Serves static client side code
 * In development environment it uses webpack-dev-middleware to serve code from the memory
 */

const path = require('path');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const buildConfig = require('../../webpack.config.js');
const logger = require('./utils/logger');

const { getSurvey, getSurveys } = require('./services/predix');

const DIST_DIR = path.join(__dirname, '../../dist');

const isDevelopment = process.env.NODE_ENV === 'development';
const env = process.env.NODE_ENV || 'production';

const webpackConfig = buildConfig(env);

function staticFrontend(app) {
  /**
   * Check that we request existent survey
   * Otherwise return 404 for index page
   * If request without defining survey id
   *   try to redirect to the survey user opened previously
   *   otherwise get the list of surveys and redirect to the first one
   */
  app.use((req, res, next) => {
    // if we did define survey id
    if (req.path === '/' && !req.query.id) {
      // is user before chosen some survey, redirect there
      if (req.session.surveyId) {
        res.redirect(`/?id=${req.session.surveyId}`);

      // otherwise get list of survey and redirect to the first one
      } else {
        getSurveys().then((surveys) => {
          if (surveys.length) {
            const surveyId = surveys[0].uri.split('/').pop();
            res.redirect(`/?id=${surveyId}`);
          } else {
            res.statusCode = 500;
            res.send('Error. There are no surveys. Please add some surveys first.');
          }
        }).catch((err) => {
          logger.error(err);
          res.statusCode = 500;
          res.send('Error. Cannot get list of surveys.');
        });
      }

    // if we defined survey id
    } else if (req.path === '/' && req.query.id) {
      getSurvey(req.query.id).then((survey) => {
        const surveyId = survey.uri.split('/').pop();
        // save survey id to the session
        req.session.surveyId = surveyId;
        next();
      }).catch((err) => {
        logger.error(err);
        res.statusCode = 404;
        res.send(`Error 404. Survey with id "${req.query.id}" is not found.`);
      });
    } else {
      next();
    }
  });

  if (isDevelopment) {
    const compiler = webpack(webpackConfig);

    app.use(webpackDevMiddleware(compiler, {
      publicPath: webpackConfig.output.publicPath,
      stats: { colors: true },
    }));
  } else {
    app.use(express.static(DIST_DIR));
  }
}

module.exports = staticFrontend;
