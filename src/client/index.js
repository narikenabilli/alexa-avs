/**
 * Main module which takes about interaction on the client side page
 */
import $ from 'jquery';
// have to disable lint rules for next module, it causes false positive reactions
import * as Cookies from 'tiny-cookie'; // eslint-disable-line import/no-unresolved, import/extensions
import AVS from 'alexa-voice-service';

import 'bootstrap/dist/css/bootstrap.css';

import sendAudio from './send-audio';
import './style.css';

/*
  Variables
 */
const avs = new AVS({
  debug: false,
});

const $btnLogin = $('#btn-login');
const $linkLogout = $('#link-logout');
const $linkHelp = $('#link-help');
const $helpPopup = $('#help');
const $helpClose = $('#help-close');
const $btnTalk = $('#btn-talk');
const $loader = $('#loader');
const $message = $('#message');
const $equaliser = $('#equaliser');
const $userName = $('#user-name');
const $loginForm = $('#login-form');

const isLoggedIn = !!Cookies.get('isLoggedIn');

/*
  Functions
 */
function showLoader() {
  $btnLogin.hide();
  $btnTalk.hide();
  $equaliser.hide();
  $loader.show();
}

function hideLoader() {
  $btnLogin.toggle(!isLoggedIn);
  $btnTalk.toggle(isLoggedIn);
  $loader.hide();
}

function showEqualiser() {
  $btnLogin.hide();
  $btnTalk.hide();
  $loader.hide();
  $equaliser.show();
}

function hideEqualiser() {
  $btnLogin.toggle(!isLoggedIn);
  $btnTalk.toggle(isLoggedIn);
  $equaliser.hide();
}

function showErrorMessage(message) {
  $message
    .addClass('error')
    .html(`${message}<br> Please try again.`)
    .show();
}

function showHelpMessage(message) {
  $message
    .removeClass('error')
    .html(message)
    .show();
}

function hideMessage() {
  $message.hide();
}

function validateLoginForm() {
  $btnLogin.prop('disabled', $userName.val().trim() < 1);
}

function onLogin() {
  setTimeout(() => {
    $userName.prop('disabled', true);
  }, 1);
  showLoader();
}

function showHelpPopup() {
  $helpPopup.show();
}

function hideHelpPopup() {
  $helpPopup.hide();
}

/*
  Code of this method is heavily based on the code from
  https://github.com/miguelmota/alexa-voice-service.js/blob/master/example/index.js
  which is distributed under MIT license
 */
function stopRecording() {
  $(window).off('mouseup', stopRecording);
  hideMessage();

  avs.stopRecording().then((dataView) => {
    // uncomment lines to play text which you speak to Alexa
    /* avs.player.emptyQueue()
      .then(() => avs.audioToBlob(dataView))
      // .then(blob => logAudioBlob(blob, 'VOICE'))
      .then(() => avs.player.enqueue(dataView))
      .then(() => avs.player.play())
      .catch((error) => {
        console.error(error);
      }); */


    showLoader();
    sendAudio.call(avs, dataView)
      .then(({ xhr, response }) => {
        const promises = [];
        const audioMap = {};
        let directives = null;

        function findAudioFromContentId(contentId) {
          const contentIdCleared = contentId.replace('cid:', '');
          const keys = Object.keys(audioMap);

          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.indexOf(contentIdCleared) > -1) {
              return audioMap[key];
            }
          }

          return undefined;
        }

        if (response.multipart.length) {
          response.multipart.forEach((multipart) => {
            let body = multipart.body;
            if (multipart.headers && multipart.headers['Content-Type'] === 'application/json') {
              try {
                body = JSON.parse(body);
              } catch (error) {
                showErrorMessage('Service response error.');
              }

              if (body && body.messageBody && body.messageBody.directives) {
                directives = body.messageBody.directives;
              }
            } else if (multipart.headers['Content-Type'] === 'audio/mpeg') {
              const start = multipart.meta.body.byteOffset.start;
              const end = multipart.meta.body.byteOffset.end;

              /**
               * Not sure if bug in buffer module or in http message parser
               * because it's joining arraybuffers so I have to this to
               * seperate them out.
               */
              const slicedBody = xhr.response.slice(start, end);

              audioMap[multipart.headers['Content-ID']] = slicedBody;
            }
          });

          directives.forEach((directive) => {
            if (directive.namespace === 'SpeechSynthesizer') {
              if (directive.name === 'speak') {
                const contentId = directive.payload.audioContent;
                const audio = findAudioFromContentId(contentId);
                if (audio) {
                  avs.audioToBlob(audio);
                  promises.push(avs.player.enqueue(audio));
                }
              }
            } else if (directive.namespace === 'AudioPlayer') {
              if (directive.name === 'play') {
                const streams = directive.payload.audioItem.streams;
                streams.forEach((stream) => {
                  const streamUrl = stream.streamUrl;

                  const audio = findAudioFromContentId(streamUrl);
                  if (audio) {
                    avs.audioToBlob(audio);
                    promises.push(avs.player.enqueue(audio));
                  } else if (streamUrl.indexOf('http') > -1) {
                    const xhrPlaylist = new XMLHttpRequest();
                    const urlPlaylist = `/parse-m3u?url=${streamUrl.replace(/!.*$/, '')}`;
                    xhrPlaylist.open('GET', urlPlaylist, true);
                    xhrPlaylist.responseType = 'json';
                    xhrPlaylist.onload = (event) => {
                      const urls = event.currentTarget.response;

                      urls.forEach((urlAudio) => {
                        avs.player.enqueue(urlAudio);
                      });
                    };
                    xhrPlaylist.send();
                  }
                });
              } else if (directive.namespace === 'SpeechRecognizer') {
                if (directive.name === 'listen') {
                  // TODO: ask to enable mic and talk
                }
              }
            }
          });

          if (promises.length) {
            Promise.all(promises)
              .then(() => {
                hideLoader();
                showEqualiser();
                avs.player.playQueue().then(() => {
                  hideEqualiser();
                }).catch(() => {
                  hideLoader();
                  showErrorMessage('Cannot play the response. Maybe try another browser.');
                });
              });
          } else {
            hideLoader();
            showErrorMessage("Haven't got any response from Alexa.");
          }
        }
      })
      .catch(() => {
        hideLoader();
        showErrorMessage('Service response error.');
      });
  });
}

function startRecording() {
  avs.startRecording();

  $(window).on('mouseup', stopRecording);
}

/* eslint-disable no-underscore-dangle */
/*
  Fixed connectMediaStream function for AVS
 */
function connectMediaStream(stream) {
  return new Promise((resolve, reject) => {
    const isMediaStream = ['[object MediaStream]', '[object LocalMediaStream]'].indexOf(Object.prototype.toString.call(stream)) > -1;

    if (!isMediaStream) {
      const error = new TypeError('Argument must be a `MediaStream` object.');
      this._log('error', error);
      this.emit(AVS.EventTypes.ERROR, error);
      return reject(error);
    }

    this._audioContext = new AudioContext();
    this._sampleRate = this._audioContext.sampleRate;

    this._log(`Sample rate: ${this._sampleRate}.`);

    this._volumeNode = this._audioContext.createGain();
    this._audioInput = this._audioContext.createMediaStreamSource(stream);

    this._audioInput.connect(this._volumeNode);

    this._recorder = this._audioContext.createScriptProcessor(
      this._bufferSize, this._inputChannels, this._outputChannels);

    this._recorder.onaudioprocess = (event) => {
      if (!this._isRecording) {
        return false;
      }

      const left = event.inputBuffer.getChannelData(0);
      this._leftChannel.push(new Float32Array(left));

      if (this._inputChannels > 1) {
        const right = event.inputBuffer.getChannelData(1);
        this._rightChannel.push(new Float32Array(right));
      }

      this._recordingLength += this._bufferSize;

      return true;
    };

    this._volumeNode.connect(this._recorder);
    this._recorder.connect(this._audioContext.destination);
    this._log('Media stream connected.');

    return resolve(stream);
  });
}

/*
  Fixed requestMic function for AVS
 */
function requestMic() {
  return new Promise((resolve, reject) => {
    this._log('Requesting microphone.');

    // Ensure that the file can be loaded in environments
    // where navigator is not defined (node servers)
    if (!navigator.getUserMedia) {
      navigator.getUserMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
        navigator.msGetUserMedia
      );
    }

    navigator.getUserMedia({
      audio: true,
    }, (stream) => {
      this._log('Microphone connected.');
      return connectMediaStream.call(this, stream).then(resolve);
    }, (error) => {
      this._log('error', error);
      this.emit(AVS.EventTypes.ERROR, error);
      return reject(error);
    });
  });
}
/* eslint-enable no-underscore-dangle */

/*
  Run
 */
if (isLoggedIn) {
  requestMic.call(avs).then(() => {
    showHelpMessage('To start survey,<br>click and hold "Hold&nbsp;&&nbsp;Speak" button<br> and say "start&nbsp;Predix&nbsp;Survey".');
    $btnTalk.prop('disabled', false);
  });
}

$btnTalk.on('mousedown', startRecording);
$loginForm.on('submit', onLogin);
$userName.on('keyup change', validateLoginForm);
$linkHelp.on('click', (evt) => {
  evt.preventDefault();
  showHelpPopup();
});
$helpClose.on('click', hideHelpPopup);

validateLoginForm();

$loginForm.toggle(!isLoggedIn);
$btnLogin.toggle(!isLoggedIn);
$linkLogout.toggle(isLoggedIn);
$linkHelp.toggle(isLoggedIn);
$btnTalk.toggle(isLoggedIn);
$message.toggle(isLoggedIn);

if (!isLoggedIn) {
  $userName.focus();
}

