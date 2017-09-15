/**
 * Code of this module was taken from 'alexa-voice-service' package file lib/AVS.js method sendAudio
 * We just changed url here because we want to send requests to our custom server
 * rather then directly to amazon.
 * Also remove header with bearer token which we don't need here.
 *
 * As this code doesn't fully satisfy our eslint rules we disable some, to keep code as it is
 * because it works :-)
 */
/* eslint-disable no-underscore-dangle, no-bitwise, no-plusplus */

import AVS from 'alexa-voice-service';
import AMAZON_ERROR_CODES from 'alexa-voice-service/lib/AmazonErrorCodes';
import httpMessageParser from 'http-message-parser';
import arrayBufferToString from 'alexa-voice-service/lib/utils/arrayBufferToString';
import getLocationOrigin from './location-origin';

export default function sendAudio(dataView) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${getLocationOrigin()}/recognize`;

    xhr.open('POST', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      const buffer = new Buffer(xhr.response);

      if (xhr.status === 200) {
        const parsedMessage = httpMessageParser(buffer);
        resolve({ xhr, response: parsedMessage });
      } else {
        let error = new Error('An error occured with request.');
        let response = {};

        if (!xhr.response.byteLength) {
          error = new Error('Empty response.');
        } else {
          try {
            response = JSON.parse(arrayBufferToString(buffer));
          } catch (err) {
            error = err;
          }
        }

        if (response.error instanceof Object) {
          if (response.error.code === AMAZON_ERROR_CODES.InvalidAccessTokenException) {
            this.emit(AVS.EventTypes.TOKEN_INVALID);
          }

          error = response.error.message;
        }

        this.emit(AVS.EventTypes.ERROR, error);
        reject(error);
      }
    };

    xhr.onerror = (error) => {
      this._log(error);
      reject(error);
    };

    const BOUNDARY = 'BOUNDARY1234';
    const BOUNDARY_DASHES = '--';
    const NEWLINE = '\r\n';
    const METADATA_CONTENT_DISPOSITION = 'Content-Disposition: form-data; name="metadata"';
    const METADATA_CONTENT_TYPE = 'Content-Type: application/json; charset=UTF-8';
    const AUDIO_CONTENT_TYPE = 'Content-Type: audio/L16; rate=16000; channels=1';
    const AUDIO_CONTENT_DISPOSITION = 'Content-Disposition: form-data; name="audio"';

    const metadata = {
      messageHeader: {},
      messageBody: {
        profile: 'alexa-close-talk',
        locale: 'en-us',
        format: 'audio/L16; rate=16000; channels=1',
      },
    };

    const postDataStart = [
      NEWLINE, BOUNDARY_DASHES, BOUNDARY, NEWLINE, METADATA_CONTENT_DISPOSITION, NEWLINE,
      METADATA_CONTENT_TYPE,
      NEWLINE, NEWLINE, JSON.stringify(metadata), NEWLINE, BOUNDARY_DASHES, BOUNDARY, NEWLINE,
      AUDIO_CONTENT_DISPOSITION, NEWLINE, AUDIO_CONTENT_TYPE, NEWLINE, NEWLINE,
    ].join('');

    const postDataEnd = [NEWLINE, BOUNDARY_DASHES, BOUNDARY, BOUNDARY_DASHES, NEWLINE].join('');

    const size = postDataStart.length + dataView.byteLength + postDataEnd.length;
    const uint8Array = new Uint8Array(size);
    let i = 0;

    for (; i < postDataStart.length; i++) {
      uint8Array[i] = postDataStart.charCodeAt(i) & 0xFF;
    }

    for (let j = 0; j < dataView.byteLength; i++, j++) {
      uint8Array[i] = dataView.getUint8(j);
    }

    for (let j = 0; j < postDataEnd.length; i++, j++) {
      uint8Array[i] = postDataEnd.charCodeAt(j) & 0xFF;
    }

    const payload = uint8Array.buffer;

    xhr.setRequestHeader('Content-Type', `multipart/form-data; boundary=${BOUNDARY}`);
    xhr.send(payload);
  });
}
