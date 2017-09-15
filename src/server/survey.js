/**
 * Survey class
 */

const uuidv4 = require('uuid/v4');
const { getSurvey, createResponse } = require('./services/predix');
const logger = require('./utils/logger');

class Survey {
  constructor(id) {
    this.id = id;
    this.uuid = uuidv4();
    this.currentIndex = 0;

    this.answers = [];

    this.readyCache = null;
    this.ready();
    Survey.set(this.uuid, this);
  }

  /**
   * Waits until survey is loaded
   *
   * @return {Promise} resolves to survey instance
   */
  ready() {
    if (!this.readyCache) {
      this.readyCache = getSurvey(this.id).then((survey) => {
        Object.assign(this, survey);
        this.title = survey.title;

        return this;
      });
    }

    return this.readyCache;
  }

  /**
   * Gets current question
   *
   * @return {Object} current question
   */
  getQuestion() {
    let question = null;

    if (this.currentIndex >= 0 && this.currentIndex < this.questions.length) {
      question = this.questions[this.currentIndex];
    }

    return question;
  }

  /**
   * Set answer to the current question
   *
   * @param {String} answerText answer text
   */
  setAnswer(answerText) {
    const question = this.getQuestion();

    if (question) {
      this.answers.push({
        questionId: question.id,
        text: answerText,
      });
    }

    this.currentIndex += 1;
  }

  /**
   * Saves all answers
   *
   * @param  {String} userName user name
   * @return {Promise}         resolves is saved successfully
   */
  saveResponse(userName) {
    const response = {
      uri: `/response/${this.uuid}`,
      surveyUri: this.uri,
      userName,
      answers: this.answers,
    };

    logger.verbose(`Saving response: ${JSON.stringify(response)}`);
    return createResponse(response);
  }
}

Survey.surveys = {};

Survey.get = uuid => Survey.surveys[uuid] || null;

Survey.set = (uuid, survey) => {
  Survey.surveys[uuid] = survey;
};

module.exports = Survey;
