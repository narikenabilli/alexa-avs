/**
 * Alexa Skill service for 'Predix Survey' Skill
 */

const alexa = require('alexa-app');

const alexaApp = new alexa.app('surveys'); // eslint-disable-line new-cap
const logger = require('./utils/logger');
const Survey = require('./survey');

const currentData = {};

const messages = {
  REPEAT_PROMPT: 'Sorry, could you repeat your answer, please.',
  SURVEY_FINISHED: 'Survey is finished. Thank you for answers, have a nice day!',
  SURVEY_START: 'Let\'s start survey with the title,',
  YOUR_ANSWER: 'So your answer is',
  CANCEL_DURING_SURVEY: 'Sorry. Word is not a bird. I\'ve already wrote down your answers. Goodbye!',
  CANCEL_WITHOUT_SURVEY: 'Sure. Bye!',
  STOP_DURING_SURVEY: 'Sure. Thank you for your answers. Goodbye!',
  STOP_WITHOUT_SURVEY: 'Ok. Bye!',
  HELP: 'Please, reply with the short answers on the one breath.',
  HELP_START: 'To start a new survey, say <break time="0.2s"/> "start Predix Survey".',
  EXCEPTION_ERROR: 'Ups, something bad happened.',
  RESUME: 'Let\'s continue survey.',
};

// reply message if not intents were found
alexaApp.messages.NO_INTENT_FOUND = 'Hmm... I wasn\'t ready for this. I have to learn more to understand your intents better.';

/**
 * Helper function to log actions
 *
 * @param  {String} actionName action name
 * @param  {Object} request    alexa-app request from Alexa
 */
function logAction(actionName, request) {
  const session = request.getSession();

  const data = JSON.stringify({
    type: request.type(),
    slotValue: request.slots.LiteralAnswer && request.slots.LiteralAnswer.value,
    surveyUuid: session.get('surveyUuid'),
  });

  logger.verbose(`${actionName} ${data}`);
}

/**
 * Get current survey passed by user from the session
 *
 * @param  {Object} request alexa-app request from Alexa
 * @return {Object}         survey object or null
 */
function getCurrentSurvey(request) {
  const session = request.getSession();
  const surveyId = session.get('surveyUuid');
  let survey = null;

  if (surveyId) {
    survey = Survey.get(surveyId);
  }

  return survey;
}

/**
 * Asks next question and tell some pre-question phrase
 *
 * @param  {Object} request         alexa-app request from Alexa
 * @param  {Object} request         alexa-app response to Alexa
 * @param  {String} preQuestionText text to tell before asking new question
 * @return {Promise}
 */
function askQuestion(request, response, preQuestionText) {
  logger.verbose(`askQuestion: ${preQuestionText}`);

  const survey = getCurrentSurvey(request);

  return survey.ready().then(() => {
    const question = survey.getQuestion();

    if (question) {
      logger.verbose(`Got new question: ${question.text}`);

      response
        .say(`${preQuestionText} <break time="0.5s"/> ${question.text}`)
        .shouldEndSession(false, messages.REPEAT_PROMPT);
    } else {
      logger.verbose('Questions are finished');

      survey.saveResponse(currentData.userName);

      response.say(`${preQuestionText} <break time="0.5s"/> ${messages.SURVEY_FINISHED}`);
    }
  });
}

/**
 * Action to handle start/launch survey intent
 *
 * @param  {Object} request         alexa-app request from Alexa
 * @param  {Object} request         alexa-app response to Alexa
 * @return {Promise}
 */
function actionStartSurvey(request, response) {
  logAction('actionStartSurvey', request);

  const session = request.getSession();
  const survey = new Survey(currentData.surveyId);
  session.set('surveyUuid', survey.uuid);

  return survey.ready().then(() => askQuestion(request, response, `${messages.SURVEY_START} "${survey.title}".`));
}

/**
 * Action to handle literal answer intent
 *
 * @param  {Object} request         alexa-app request from Alexa
 * @param  {Object} request         alexa-app response to Alexa
 * @return {Promise}
 */
function actionProcessLiteralAnswer(request, response) {
  logAction('actionProcessLiteralAnswer', request);

  const survey = getCurrentSurvey(request);

  if (!survey) {
    return actionStartSurvey(request, response);
  }

  const answerText = request.slots.LiteralAnswer.value;
  survey.setAnswer(answerText);

  return askQuestion(request, response, `${messages.YOUR_ANSWER} ${answerText}.`);
}

/**
 * Action to handle cancel intent
 *
 * @param  {Object} request         alexa-app request from Alexa
 * @param  {Object} request         alexa-app response to Alexa
 * @return {Promise}
 */
function actionCancel(request, response) {
  logAction('actionCancel', request);

  const survey = getCurrentSurvey(request);
  let replyMsg;

  if (survey) {
    replyMsg = messages.CANCEL_DURING_SURVEY;
    survey.saveResponse(currentData.userName);
  } else {
    replyMsg = messages.CANCEL_WITHOUT_SURVEY;
  }

  response.say(replyMsg);
}

/**
 * Action to handle stop intent
 *
 * @param  {Object} request         alexa-app request from Alexa
 * @param  {Object} request         alexa-app response to Alexa
 * @return {Promise}
 */
function actionStop(request, response) {
  logAction('actionStop', request);

  const survey = getCurrentSurvey(request);
  let replyMsg;

  if (survey) {
    replyMsg = messages.STOP_DURING_SURVEY;
    survey.saveResponse(currentData.userName);
  } else {
    replyMsg = messages.STOP_WITHOUT_SURVEY;
  }

  response.say(replyMsg);
}

/**
 * Action to handle help intent
 *
 * @param  {Object} request         alexa-app request from Alexa
 * @param  {Object} request         alexa-app response to Alexa
 * @return {Promise}
 */
function actionHelp(request, response) {
  logAction('actionHelp', request);

  const survey = getCurrentSurvey(request);

  if (survey) {
    return askQuestion(request, response, messages.HELP);
  }

  return Promise.resolve(() => {
    response.say(`${messages.HELP_START} <break time="0.2s"/> ${messages.HELP}`);
  });
}

/**
 * Action to handle resume intent
 *
 * @param  {Object} request         alexa-app request from Alexa
 * @param  {Object} request         alexa-app response to Alexa
 * @return {Promise}
 */
function actionResume(request, response) {
  logAction('actionResume', request);

  const survey = getCurrentSurvey(request);

  if (survey) {
    return askQuestion(request, response, messages.RESUME);
  }

  return actionStartSurvey(request, response);
}

alexaApp.launch(actionStartSurvey);

alexaApp.intent('LiteralAnswerIntent', {
  slots: {},
  utterances: [],
}, actionProcessLiteralAnswer);

alexaApp.intent('AMAZON.CancelIntent', {
  slots: {},
  utterances: [],
}, actionCancel);

alexaApp.intent('AMAZON.StopIntent', {
  slots: {},
  utterances: [],
}, actionStop);

alexaApp.intent('AMAZON.HelpIntent', {
  slots: {},
  utterances: [],
}, actionHelp);

alexaApp.intent('AMAZON.ResumeIntent', {
  slots: {},
  utterances: [],
}, actionResume);

// if some error has happened
alexaApp.error = (exception, request, response) => {
  logger.error(exception);
  response.say(messages.EXCEPTION_ERROR);
};

/*
  This is a hack
  It's very complicated to associate frontend user session with Alexa Skill user
  We have to build our own oAuth 2.0 server and ask user to link accounts for it
  https://developer.amazon.com
  /public/solutions/alexa/alexa-skills-kit/docs/linking-an-alexa-user-with-a-user-in-your-system

  So I use such hack to pass user name and survey id from the frontend
  The drawback of this approach is that we loose sessions and all the clients works with the same
  user name and survey id
 */
function alexAppHack(app) {
  app.use((req, res, next) => {
    if (req.session.userName) {
      currentData.userName = req.session.userName;
    }

    if (req.session.surveyId) {
      currentData.surveyId = req.session.surveyId;
    }

    next();
  });
  alexaApp.express({ expressApp: app });
}

module.exports = alexAppHack;

// this code is for quick skill test
// run from the root of the project
// NODE_ENV=development node ./src/server/alexa-skill.js
// to quickly check that skill can be run
// it has to be run only when Predix services are fully configured
// and demo surveys are populated
if (!module.parent) {
  currentData.surveyId = '3';
  currentData.userName = 'Jhon Test';

  const request = {
    type: () => 'test',
    slots: { LiteralAnswer: { value: 'testText' } },
    hasSession: () => false,
    getSession: () => ({
      get: id => request.sessionStore[id],
      set: (id, value) => { request.sessionStore[id] = value; },
    }),
    context: 'test',
    sessionStore: {},
  };
  const response = {
    say: (questionText) => {
      logger.verbose('say:', questionText);

      return response;
    },
    shouldEndSession: () => {},
  };

  actionStartSurvey(request, response).catch((err) => {
    logger.error(err);
  }).then(() => {
    actionProcessLiteralAnswer(request, response).then(() => {
      actionProcessLiteralAnswer(request, response);
    });
  });
}
