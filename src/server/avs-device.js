const config = require('../../config/config');
const uuid = require('uuid');
const express = require('express');
const rp = require('request-promise-native');
const logger = require('./utils/logger');
const querystring = require('querystring');
const request = require('request');

const router = express.Router();
const renewTokenSecsBefore = 180;

/**
 * Add basicUrl with correct protocol
 *
 * Now using hacky way where protocol is http always for localhost and https otherwise
 * Unfortunately any real ways to detect protocol doesn't work at Predix Cloud
 */
router.use((req, res, next) => {
  req.basicUrl = `http${req.get('Host').indexOf('localhost') > -1 ? '' : 's'}://${req.get('Host')}`;

  next();
});

/**
 * Set/remove isLoggedIn cookie to let client side know if user is authorized or no
 */
router.use((req, res, next) => {
  if (req.cookies.isLoggedIn && !req.session.auth) {
    res.clearCookie('isLoggedIn');
  } else if (req.session.auth && !req.cookies.isLoggedIn) {
    res.cookie('isLoggedIn', 'true', { maxAge: 365 * 24 * 60 * 60 * 1000 });
  }
  next();
});

/**
 * Login endpoint which redirect to LWA page
 */
router.get('/login', (req, res) => {
  // save user name to the session
  if (req.query.user_name) {
    req.session.userName = req.query.user_name;
  }

  req.session.authStateCode = uuid.v4();

  const authUrl = `${config.amazon.lwaRedirectUrl}?${querystring.stringify({
    client_id: config.amazon.clientId,
    scope: 'alexa:all',
    scope_data: JSON.stringify({
      'alexa:all': {
        productID: config.amazon.deviceId,
        productInstanceAttributes: {
          deviceSerialNumber: config.amazon.deviceSn,
        },
      },
    }),
    state: req.session.authStateCode,
    response_type: 'code',
    redirect_uri: `${req.basicUrl}/authresponse`,
  })}`;

  res.redirect(authUrl);
});

/**
 * Logout endpoint, removes auth data from user session
 */
router.get('/logout', (req, res) => {
  req.session.auth = null;

  res.redirect('/');
});

/**
 * This is callback endpoint from LWA service which gets code and retrieves access_token
 */
router.get('/authresponse', (req, res) => {
  const authCode = req.query.code;
  const stateCode = req.query.state;

  if (req.session.authStateCode !== stateCode) {
    res.statusCode = 500;
    res.send({ error: 'TokenRetrievalFailure', message: 'Unexpected failure while retrieving tokens. Status code mismatch.' });
  }

  const options = {
    url: config.amazon.lwaApiTokenUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    form: {
      grant_type: 'authorization_code',
      code: authCode,
      client_id: config.amazon.clientId,
      client_secret: config.amazon.clientSecret,
      state: stateCode,
      redirect_uri: `${req.basicUrl}/authresponse`,
    },
  };

  rp(options).then((response) => {
    const auth = JSON.parse(response);
    auth.timestamp = (new Date()).getTime();
    req.session.auth = auth;
    res.redirect('/');
  }).catch((err) => {
    logger.error(err);
    res.status(err.statusCode);
    res.send({ error: err.name, message: err.message });
  });
});

/**
 * Obtain access_token using refreshToken
 *
 * @param  {String} refreshToken refresh token
 * @return {Promise}              resolves to returned auth object
 */
function getAccessTokenByRefresh(refreshToken) {
  logger.verbose('Refreshing token');

  const options = {
    url: config.amazon.lwaApiTokenUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.amazon.clientId,
      client_secret: config.amazon.clientSecret,
    },
  };

  return rp(options).then((response) => {
    const auth = JSON.parse(response);
    auth.timestamp = (new Date()).getTime();

    return auth;
  });
}

/**
 * Returns current access token
 * If necessary refresh token first
 *
 * @param  {Object}  req express request object
 * @return {Promise}     resolves to access token
 */
function getToken(req) {
  if (!req.session.auth) {
    return Promise.reject('User is not authorized!');
  }

  const secondsSinceLogin = ((new Date()).getTime() - req.session.auth.timestamp) / 1000;

  // if token is older then expire time minus 10 minutes, refresh it now
  // don't wait until the last moment to cover network delays for sure
  if (secondsSinceLogin > req.session.auth.expires_in - renewTokenSecsBefore) {
    return getAccessTokenByRefresh(req.session.auth.refresh_token).then((auth) => {
      req.session.auth = auth;

      return req.session.auth.access_token;
    });
  }

  return Promise.resolve(req.session.auth.access_token);
}

/**
 * Proxy recognize requests from the frontend to amazon Alexa service
 */
router.post('/recognize', (req, res) => {
  getToken(req).then((token) => {
    req.on('error', (err) => {
      logger.error(err);
      res.statusCode = 500;
      res.send(err);
    }).pipe(request('https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize', {
      agent: false,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, (err) => {
      if (err) {
        logger.error(err);
        res.statusCode = 403;
        res.send(err);
      }
    })).pipe(res);
  }).catch((err) => {
    logger.error(err);
    res.statusCode = 403;
    res.send(err);
  });
});

module.exports = router;
