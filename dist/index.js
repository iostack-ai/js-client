(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jwt-decode"));
	else if(typeof define === 'function' && define.amd)
		define(["jwt-decode"], factory);
	else if(typeof exports === 'object')
		exports["iostackClient"] = factory(require("jwt-decode"));
	else
		root["iostackClient"] = factory(root["jwt_decode"]);
})(this, (__WEBPACK_EXTERNAL_MODULE__372__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 372:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__372__;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  IOStackClient: () => (/* binding */ IOStackClient)
});

// EXTERNAL MODULE: external {"commonjs":"jwt-decode","commonjs2":"jwt-decode","amd":"jwt-decode","root":"jwt_decode"}
var external_commonjs_jwt_decode_commonjs2_jwt_decode_amd_jwt_decode_root_jwt_decode_ = __webpack_require__(372);
;// ./src/aborthandler.ts
class IOStackAbortHandler {
    controller;
    signal;
    timeoutId;
    constructor(timeoutInMillis) {
        this.controller = new AbortController();
        this.signal = this.controller.signal;
        this.timeoutId = setTimeout(() => this.controller.abort(), timeoutInMillis);
    }
    getSignal() {
        return this.signal;
    }
    reset() {
        clearTimeout(this.timeoutId);
    }
}

;// ./src/iostack_client.ts
/* eslint-disable no-console */


class IOStackClient {
    // Hold all sensitive data here
    #closure;
    platform_root;
    session_id;
    use_case_data;
    user_id;
    // Notification packet handlers
    streamFragmentHandlers;
    errorHandlers;
    useCaseNotificationHandlers;
    useCaseActiveNodeChangeNotificationHandlers;
    useCaseStreamedReferenceNotificationHandlers;
    decoder;
    metadata;
    runningBuffer = "";
    response_timeout;
    constructor({ access_key, use_case_data, user_id, platform_root, response_timeout, }) {
        this.platform_root = platform_root || 'https://platform.iostack.ai';
        this.use_case_data = use_case_data || {};
        this.user_id = user_id || null;
        this.session_id = null;
        this.streamFragmentHandlers = [];
        this.errorHandlers = [];
        this.useCaseNotificationHandlers = [];
        this.useCaseActiveNodeChangeNotificationHandlers = [];
        this.useCaseStreamedReferenceNotificationHandlers = [];
        this.decoder = new TextDecoder();
        this.metadata = {};
        this.runningBuffer = "";
        this.response_timeout = response_timeout || 30;
        // Set up #private data for sensitive details
        this.#closure = {
            refresh_token: '',
            access_token: '',
            access_key,
            access_token_refresh_time: new Date(0),
            refresh_token_refresh_time: new Date(0),
        };
    }
    getSessionId() {
        return this.session_id;
    }
    deregisterAllHandlers() {
        this.streamFragmentHandlers = [];
        this.errorHandlers = [];
        this.useCaseNotificationHandlers = [];
        this.useCaseActiveNodeChangeNotificationHandlers = [];
        this.useCaseStreamedReferenceNotificationHandlers = [];
    }
    async startSession(sessionId = undefined) {
        await this.restartSession(sessionId);
        await this.sendMessage(this.metadata.trigger_phrase || '-'); // Send blank input to trigger first response
    }
    async restartSession(sessionId = undefined) {
        this.session_id = null;
        this.metadata = {};
        if (sessionId) {
            this.session_id = sessionId;
            await this.retrieveAccessToken();
            await this.retrieveUseCaseMetaData();
        }
        else {
            await this.establishSession();
        }
    }
    async sendMessage(message) {
        if (!message) {
            return;
        }
        if (!this.session_id) {
            this.reportErrorString('Error sending message', 'Session has not yet been established');
            return;
        }
        const headers = await this.getHeaders();
        const postBody = {
            message,
            emit_llm_data: true
        };
        const abortHandler = new IOStackAbortHandler(this.response_timeout * 1000);
        this.runningBuffer = "";
        const url = `${this.platform_root}/v2/use_case/session/${this.session_id}/stream`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(postBody),
                signal: abortHandler.getSignal(),
            });
            if (!response.ok || !response.body) {
                const error = await this.reportError(response);
                throw new Error(error);
            }
            const reader = response.body.getReader();
            const lambda = async (message) => {
                const streamedResponsesString = this.decoder.decode(message.value, { stream: true });
                try {
                    await this.processSSEMessage(streamedResponsesString);
                }
                catch (e) {
                    this.reportErrorString('Error while decoding streaming response', e.toString());
                    throw e;
                }
                if (message.done) {
                    return;
                }
                await reader.read().then(lambda);
            };
            return await reader.read().then(lambda);
        }
        catch (e) {
            this.reportErrorString('Error while streaming response', e.toString());
            throw e;
        }
        finally {
            abortHandler.reset();
        }
    }
    getTriggerPrompt() {
        if (!this.metadata.trigger_phrase) {
            this.reportErrorString("Can't retrieve trigger prompt", 'Metadata not retrieved');
            return '';
        }
        return this.metadata.trigger_phrase;
    }
    async getHeaders() {
        if (this.refreshTokenExpired()) {
            await this.refreshRefreshToken();
        }
        if (this.accessTokenExpired()) {
            await this.refreshAccessToken();
        }
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.getAccessToken()}`);
        return headers;
    }
    async processSSEMessage(streamedResponsesString) {
        this.runningBuffer += streamedResponsesString;
        let parts = this.runningBuffer.split("\n\n");
        this.runningBuffer = parts.pop() || ""; // incomplete
        for (const part of parts) {
            if (part.startsWith("data:")) {
                const remainder = part.replace(/^data:\s*/, "");
                // console.log(`Processing ${remainder}`)
                await this.handleStreamingResponse((remainder));
            }
        }
    }
    async handleStreamingResponse(streamedResponseString) {
        if (!streamedResponseString)
            return;
        const streamedResponse = JSON.parse(streamedResponseString);
        switch (streamedResponse.type) {
            case 'fragment':
                await this.onStreamedFragment(streamedResponse);
                break;
            case 'error': {
                if (streamedResponse.message) {
                    await this.onError(streamedResponse.message);
                    throw new Error(streamedResponse.message);
                }
                else {
                    await this.onError(streamedResponse.error);
                    throw new Error(streamedResponse.error);
                }
            }
            case 'use_case_notification':
                await this.handleUseCaseNotification(streamedResponse);
                break;
            case 'streamed_ref':
                await this.onStreamedReference(streamedResponse);
                break;
            default:
                break;
        }
    }
    async handleUseCaseNotification(result) {
        switch (result.name) {
            case 'graph_active_node_change':
                await this.onActiveNodeChange(result);
                break;
            default:
                await this.onUseCaseNotification(result);
        }
    }
    async establishSession() {
        console.log('Establishing session');
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.getAccessKey()}`);
        const postBody = {
            use_case_id: this.getAccessKey(),
            client_data: this.use_case_data,
            user_id: this.user_id || '',
        };
        const url = `${this.platform_root}/v2/use_case/session`;
        const abortHandler = new IOStackAbortHandler(30 * 1000);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(postBody),
                signal: abortHandler.getSignal(),
            });
            if (!response.ok) {
                const error = await this.reportError(response);
                throw new Error(error);
            }
            const body = await response.json();
            this.updateRefreshToken(body.refresh_token);
            if (body.access_token) {
                // console.log("Found access token in session init response")
                this.setAccessToken(body.access_token);
                this.calcAndSaveAccessTokenRefreshTime(body.access_token);
            }
            if (body.trigger_phrase) {
                // console.log("Found trigger phrase in session init response")
                this.metadata = {
                    trigger_phrase: body.trigger_phrase
                };
            }
            this.session_id = body.session_id;
        }
        catch (e) {
            this.reportErrorString('Error while establishing response', e.toString());
            throw e;
        }
        finally {
            abortHandler.reset();
        }
    }
    async retrieveAccessToken() {
        if (!this.session_id) {
            this.reportErrorString('Error retrieving access token', 'Session has not yet been established');
            return;
        }
        if (this.accessTokenRetrieved() || !this.accessTokenExpired()) {
            return;
        }
        console.log(`Retrieving access token for session ${this.session_id}`);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.getRefreshToken()}`);
        const abortHandler = new IOStackAbortHandler(30 * 1000);
        try {
            const response = await fetch(`${this.platform_root}/v2/use_case/session/${this.session_id}/access_token`, {
                method: 'POST',
                headers,
                body: '{}',
                signal: abortHandler.getSignal(),
            });
            if (!response.ok) {
                const error = await this.reportError(response);
                throw new Error(error);
            }
            const body = await response.json();
            this.setAccessToken(body.access_token);
            this.calcAndSaveAccessTokenRefreshTime(body.access_token);
        }
        catch (e) {
            this.reportErrorString('Error while retrieving access token', e.toString());
            throw e;
        }
        finally {
            abortHandler.reset();
        }
    }
    async refreshAccessToken() {
        console.log(`Refreshing access token for session ${this.session_id}`);
        if (!this.session_id) {
            this.reportErrorString('Error refreshing access token', 'Session has not yet been established');
            return;
        }
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.getRefreshToken()}`);
        const abortHandler = new IOStackAbortHandler(30 * 1000);
        try {
            const response = await fetch(`${this.platform_root}/v2/use_case/session/${this.session_id}/access_token`, {
                method: 'POST',
                headers,
                body: '{}',
                signal: abortHandler.getSignal(),
            });
            if (!response.ok) {
                const error = await this.reportError(response);
                throw new Error(error);
            }
            const body = await response.json();
            this.setAccessToken(body.access_token);
            this.calcAndSaveAccessTokenRefreshTime(body.access_token);
        }
        catch (e) {
            this.reportErrorString('Error while refreshing access token', e.toString());
            throw e;
        }
        finally {
            abortHandler.reset();
        }
    }
    async refreshRefreshToken() {
        console.log(`Refreshing refresh token for session ${this.session_id}`);
        if (!this.session_id) {
            this.reportErrorString('Error refreshing refresh token', 'Session has not yet been established');
            return;
        }
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.getAccessKey()}`);
        const postBody = {
            use_case_id: this.getAccessKey(),
            user_id: this.user_id || '',
            client_data: this.use_case_data,
        };
        const url = `${this.platform_root}/v2/use_case/session/${this.session_id}/refresh_token`;
        const abortHandler = new IOStackAbortHandler(30 * 1000);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(postBody),
                signal: abortHandler.getSignal(),
            });
            if (!response.ok) {
                const error = await this.reportError(response);
                throw new Error(error);
            }
            const body = await response.json();
            this.setRefreshToken(body.refresh_token);
        }
        catch (e) {
            this.reportErrorString('Error while refreshing session refresh token', e.toString());
            throw e;
        }
        finally {
            abortHandler.reset();
        }
    }
    async retrieveUseCaseMetaData() {
        console.log('Fetching use case metadata');
        const headers = await this.getHeaders();
        const abortHandler = new IOStackAbortHandler(30 * 1000);
        let url = `${this.platform_root}/v2/use_case/meta?details=trigger_phrase`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers,
                signal: abortHandler.getSignal(),
            });
            if (!response.ok) {
                const error = await this.reportError(response);
                throw new Error(error);
            }
            const body = await response.json();
            this.metadata = body.use_case;
        }
        catch (e) {
            this.reportErrorString('Error while retrieving use case metadata', e.toString());
            throw e;
        }
        finally {
            abortHandler.reset();
        }
    }
    calcAndSaveAccessTokenRefreshTime(access_token) {
        const decoded = (0,external_commonjs_jwt_decode_commonjs2_jwt_decode_amd_jwt_decode_root_jwt_decode_.jwtDecode)(access_token);
        if (!decoded.exp) {
            throw new Error('Access Token JWT missing exp claim');
        }
        const expiryTime = new Date(decoded.exp * 1000);
        const now = Date.now();
        const refresh_access_token_period = Math.floor((expiryTime.getTime() - now) * 0.7);
        const refreshTime = new Date(now + refresh_access_token_period);
        this.setAccessTokenRefreshTime(refreshTime);
    }
    calcAndSaveRefreshTokenRefreshTime(refresh_token) {
        const decoded = (0,external_commonjs_jwt_decode_commonjs2_jwt_decode_amd_jwt_decode_root_jwt_decode_.jwtDecode)(refresh_token);
        if (!decoded.exp) {
            throw new Error('Refresh Token JWT missing exp claim');
        }
        const expiryTime = new Date(decoded.exp * 1000);
        const now = Date.now();
        const refresh_refresh_token_period = Math.floor((expiryTime.getTime() - now) * 0.7);
        const refreshTime = new Date(now + refresh_refresh_token_period);
        this.setRefreshTokenRefreshTime(refreshTime);
    }
    addStreamFragmentHandler(i) {
        this.streamFragmentHandlers.push(i);
    }
    async onStreamedFragment(fragment) {
        this.streamFragmentHandlers.forEach(async (h) => {
            await h(fragment);
        });
    }
    addErrorHandler(i) {
        this.errorHandlers.push(i);
    }
    async onError(error) {
        this.errorHandlers.forEach(async (h) => {
            await h(error);
        });
    }
    addUseCaseNotificationHandler(i) {
        this.useCaseNotificationHandlers.push(i);
    }
    async onUseCaseNotification(notification) {
        this.useCaseNotificationHandlers.forEach(async (h) => {
            await h(notification);
        });
    }
    addStreamedReferenceHandler(i) {
        this.useCaseStreamedReferenceNotificationHandlers.push(i);
    }
    async onStreamedReference(notification) {
        this.useCaseStreamedReferenceNotificationHandlers.forEach(async (h) => {
            await h(notification);
        });
    }
    addActiveNodeChangeHandler(i) {
        this.useCaseActiveNodeChangeNotificationHandlers.push(i);
    }
    async onActiveNodeChange(notification) {
        this.useCaseActiveNodeChangeNotificationHandlers.forEach(async (h) => {
            await h(notification);
        });
    }
    async reportError(response) {
        const error = await response.json();
        const errorText = `${response.statusText}:${error.message || error.detail}`;
        await this.onError(errorText);
        return errorText;
    }
    async reportErrorString(error, message) {
        await this.onError(`${error} - ${message}`);
        // throw new Error(`${error} - ${message}`);
    }
    setRefreshToken(i) {
        this.#closure.refresh_token = i;
    }
    getRefreshToken() {
        return this.#closure.refresh_token;
    }
    setAccessToken(i) {
        this.#closure.access_token = i;
    }
    getAccessToken() {
        return this.#closure.access_token;
    }
    getAccessKey() {
        return this.#closure.access_key;
    }
    setAccessTokenRefreshTime(i) {
        this.#closure.access_token_refresh_time = i;
    }
    accessTokenRetrieved() {
        return !!this.#closure.access_token_refresh_time;
    }
    accessTokenExpired() {
        return !!this.#closure.access_token_refresh_time && new Date(Date.now()) >= this.#closure.access_token_refresh_time;
    }
    setRefreshTokenRefreshTime(i) {
        this.#closure.refresh_token_refresh_time = i;
    }
    refreshTokenExpired() {
        return (!!this.#closure.refresh_token_refresh_time && new Date(Date.now()) >= this.#closure.refresh_token_refresh_time);
    }
    updateRefreshToken(i) {
        this.setRefreshToken(i);
        this.calcAndSaveRefreshTokenRefreshTime(i);
    }
}

/******/ 	return __webpack_exports__;
/******/ })()
;
});