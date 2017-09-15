/**
 * Service to process Predix survey related requests like
 * get, create, delete surveys and create responses
 */

const rp = require('request-promise-native');
const config = require('../../../config/config');
const logger = require('../utils/logger');
const uaaUtil = require('predix-uaa-client');

/**
 * Helper function to make requests to Predix Asset Service
 * Usage interface is same with promisified request function
 * Takes care about retrieving and renewing access_token
 *
 * @param  {Object} options request options
 * @return {Promise}        resolves to requests response
 */
function requestPredix(options) {
  return uaaUtil.getToken(
    `${config.predix.uaaUrl}/oauth/token`,
    config.predix.clientId,
    config.predix.clientSecret
  ).then((auth) => {
    const authOptions = Object.assign({}, options);

    authOptions.headers = Object.assign({}, authOptions.headers, {
      'predix-zone-id': config.predix.zoneId,
      authorization: `Bearer ${auth.access_token}`,
    });

    return rp(authOptions);
  });
}

/**
 * Retrieve survey with provided id
 *
 * @param  {String} surveyId survey id
 * @return {Promise}         resolves to survey object
 */
function getSurvey(surveyId) {
  logger.verbose(`Retrieving survey with id ${surveyId}.`);

  const options = {
    url: `${config.predix.apiUrl}/survey/${surveyId}`,
    method: 'get',
  };

  logger.debug(`Request options ${options}`);

  return requestPredix(options).then((response) => {
    logger.verbose(`Successfully got survey with id ${surveyId}.`);
    logger.debug(`Request response ${response}`);

    const data = JSON.parse(response);

    if (data.length < 1) {
      throw Error(`Survey with id ${surveyId} is not found.`);
    }

    return data[0];
  });
}

/**
 * Retrieves all surveys
 *
 * @return {Promise} resolves to the array of survey objects
 */
function getSurveys() {
  logger.verbose('Retrieving surveys.');

  const options = {
    url: `${config.predix.apiUrl}/survey`,
    method: 'get',
  };

  logger.debug(`Request options ${options}`);

  return requestPredix(options).then((response) => {
    const data = JSON.parse(response);

    logger.verbose(`Successfully got ${data.length} surveys.`);
    logger.debug(`Request response ${response}`);

    return data;
  });
}

/**
 * Create surveys
 *
 * @param  {Array} data array of survey objects
 * @return {Promise}    resolves if created successfully
 */
function createSurveys(data) {
  logger.verbose('Creating surveys.');

  const options = {
    url: `${config.predix.apiUrl}/survey`,
    method: 'post',
    json: true,
    body: data,
  };

  logger.debug(`Request options ${options}`);

  return requestPredix(options).then((response) => {
    logger.verbose(`Successfully created ${data.length} surveys.`);
    logger.debug(`Request response ${response}`);
  });
}

/**
 * Removes asset with provided URI
 *
 * @param  {String} assetUri asset uri
 * @return {Promise}         resolves if removed successfully
 */
function removeAsset(assetUri) {
  logger.verbose(`Removing survey ${assetUri}.`);

  const options = {
    url: `${config.predix.apiUrl}${assetUri}`,
    method: 'delete',
  };

  logger.debug(`Request options ${options}`);

  return requestPredix(options).then(() => {
    logger.verbose(`Removed survey ${assetUri}.`);
  });
}

/**
 * Removes all existent surveys
 *
 * @return {Promise}         resolves if removed successfully
 */
function removeAllSurveys() {
  logger.verbose('Removing all existent surveys.');

  return getSurveys().then((surveys) => {
    const delRequests = surveys.map(item => removeAsset(item.uri));

    return Promise.all(delRequests);
  });
}

/**
 * Retrieves all responses
 *
 * @return {Promise} resolves to the array of response objects
 */
function getResponses() {
  logger.verbose('Retrieving responses.');

  const options = {
    url: `${config.predix.apiUrl}/response`,
    method: 'get',
  };

  logger.debug(`Request options ${options}`);

  return requestPredix(options).then((response) => {
    const data = JSON.parse(response);

    logger.verbose(`Successfully got ${data.length} responses.`);
    logger.debug(`Request response ${response}`);

    return data;
  });
}

/**
 * Removes all existent responses
 *
 * @return {Promise}         resolves if removed successfully
 */
function removeAllResponses() {
  logger.verbose('Removing all existent responses.');

  return getResponses().then((responses) => {
    const delRequests = responses.map(item => removeAsset(item.uri));

    return Promise.all(delRequests);
  });
}

/**
 * Create responses
 *
 * @param  {Array} data array of response objects
 * @return {Promise}    resolves if created successfully
 */
function createResponses(data) {
  logger.verbose(`Save ${data.length} responses.`);

  const options = {
    url: `${config.predix.apiUrl}/response`,
    method: 'post',
    json: true,
    body: data,
  };

  logger.debug(`Request options ${options}`);

  return requestPredix(options).then((response) => {
    logger.verbose(`Successfully saved ${data.length} responses.`);
    logger.debug(`Request response ${response}`);
  });
}

/**
 * Create response
 *
 * @param  {Object} response response object
 * @return {Promise}         resolves if created successfully
 */
function createResponse(response) {
  return createResponses([response]);
}

module.exports = {
  getSurveys,
  getSurvey,
  createSurveys,
  removeAllSurveys,
  createResponse,
  getResponses,
  removeAllResponses,
};
