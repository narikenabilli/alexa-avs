/**
 * This module defines the settings that need to be configured for a new
 * environment.
 */
const config = {
  logLevel: process.env.NODE_ENV === 'development' ? 'verbose' : 'info',

  amazon: {
    deviceId: 'predix_amazon_avs_1',
    deviceSn: '1',
    lwaRedirectUrl: 'https://www.amazon.com/ap/oa',
    lwaApiTokenUrl: 'https://api.amazon.com/auth/o2/token',
    clientId: '__PUT__VALUE__HERE__',
    clientSecret: '__PUT__VALUE__HERE__',
  },

  predix: {
    apiUrl: '__PUT__VALUE__HERE__',
    uaaUrl: '__PUT__VALUE__HERE__',
    clientId: '__PUT__VALUE__HERE__',
    clientSecret: '__PUT__VALUE__HERE__',
    zoneId: '__PUT__VALUE__HERE__'
  },
};

module.exports = config;
