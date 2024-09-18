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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IOStackClient: () => (/* binding */ IOStackClient)
/* harmony export */ });
/* harmony import */ var jwt_decode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(372);
/* harmony import */ var jwt_decode__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jwt_decode__WEBPACK_IMPORTED_MODULE_0__);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

class IOStackClient {
    constructor({ access_key, use_case_data, allow_browser_to_manage_tokens, use_case, platform_root, }) {
        this.platform_root = platform_root || "https://platform.iostack.ai";
        this.use_case = use_case || "";
        this.use_case_data = use_case_data;
        this.allow_browser_to_manage_tokens = allow_browser_to_manage_tokens;
        this.session_id = null;
        this.metadata = null;
        this.streamFragmentHandlers = [];
        this.llmStatsHandlers = [];
        this.errorHandlers = [];
        this.useCaseNotificationHandlers = [];
        this.useCaseActiveNodeChangeNotificationHandlers = [];
        this.decoder = new TextDecoder();
        // Set up a closure for sensitive data
        const closure = {
            refresh_token: "",
            access_token: "",
            access_key: access_key,
            access_token_refresh_time: new Date(0)
        };
        this.setRefreshToken = function (i) { closure.refresh_token = i; };
        this.getRefreshToken = function () { return closure.refresh_token; };
        this.setAccessToken = function (i) {
            if (this.allow_browser_to_manage_tokens) {
                throw new Error("Shouldn't be saving access token if the user has requested that the browser should handle it automatically");
            }
            closure.access_token = i;
        };
        this.getAccessToken = function () {
            if (this.allow_browser_to_manage_tokens) {
                throw new Error("Shouldn't be retrieving access token if the user has requested that the browser should handle it automatically");
            }
            return closure.access_token;
        };
        this.getAccessKey = function () { return closure.access_key; };
        this.setAccessTokenRefreshTime = function (i) { closure.access_token_refresh_time = i; };
        this.accessTokenExpired = function () { return !!closure.access_token_refresh_time && new Date(Date.now()) >= closure.access_token_refresh_time; };
    }
    deregisterAllHandlers() {
        this.streamFragmentHandlers = [];
        this.llmStatsHandlers = [];
        this.errorHandlers = [];
        this.useCaseNotificationHandlers = [];
        this.useCaseActiveNodeChangeNotificationHandlers = [];
    }
    registerStreamFragmentHandler(h) {
        this.streamFragmentHandlers.push(h);
    }
    registerLLMStatsHandler(h) {
        this.llmStatsHandlers.push(h);
    }
    registerErrorHandler(h) {
        this.errorHandlers.push(h);
    }
    registerUseCaseNotificationHandler(h) {
        this.useCaseNotificationHandlers.push(h);
    }
    registerUseCaseActiveNodeChangeNotificationHandler(h) {
        this.useCaseActiveNodeChangeNotificationHandlers.push(h);
    }
    getTriggerPrompt() {
        if (!this.metadata) {
            this.reportErrorString("Can't retrieve trigger prompt", "Metadata has not been retrieved yet");
        }
        return this.metadata.trigger_phrase;
    }
    startSession() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.establishSession();
                yield this.retrieveAccessToken();
                yield this.retrieveUseCaseMetaData();
                yield this.sendMessageAndStreamResponse(this.metadata.trigger_phrase);
            }
            finally {
                // All errors and exceptions should have been reported via the callback
            }
        });
    }
    getHeaders() {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        if (!this.allow_browser_to_manage_tokens) {
            headers.set('Authorization', 'Bearer ' + this.getAccessToken());
        }
        return headers;
    }
    sendMessageAndStreamResponse(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message) {
                return;
            }
            if (!this.session_id) {
                this.reportErrorString("Error sending message", "Session has not yet been established");
                return;
            }
            if (this.accessTokenExpired()) {
                yield this.refreshAccessToken();
            }
            const headers = this.getHeaders();
            const postBody = {
                message: message,
            };
            try {
                const response = yield fetch(this.platform_root + `/v1/use_case/session/${this.session_id}/stream`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(postBody),
                    credentials: !this.allow_browser_to_manage_tokens ? 'omit' : 'include',
                });
                if (!response.ok || !response.body) {
                    yield this.reportError(response);
                    return;
                }
                const reader = response.body.getReader();
                const lambda = (message) => __awaiter(this, void 0, void 0, function* () {
                    if (message.done) {
                        return;
                    }
                    yield this.processMessage(message);
                    return reader.read().then(lambda);
                });
                yield reader.read().then(lambda);
            }
            catch (e) {
                this.reportErrorString('Error while initiating streaming response', e.toString());
            }
            finally {
            }
        });
    }
    processMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.done) {
                return;
            }
            const streamedResponsesString = this.decoder.decode(message.value, { stream: true });
            const streamResponseStrings = streamedResponsesString.split('__|__');
            for (const streamedResponseString of streamResponseStrings) {
                yield this.handleStreamingResponse(streamedResponseString);
            }
        });
    }
    handleStreamingResponse(streamedResponseString) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!streamedResponseString)
                return;
            const streamedResponse = JSON.parse(streamedResponseString);
            switch (streamedResponse.type) {
                case 'fragment':
                    yield this.handleStreamedFragment(streamedResponse);
                    break;
                case 'error':
                    yield this.handleError(streamedResponse.error);
                    break;
                case 'llm_stats':
                    yield this.handleLLMStats(streamedResponse);
                    break;
                case 'use_case_notification':
                    yield this.handleUseCaseNotification(streamedResponse);
                    break;
                default:
                    console.log('Unknown streaming packet seen:\n' + streamedResponseString);
            }
        });
    }
    handleUseCaseNotification(result) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (result.name) {
                case 'graph_active_node_change':
                    yield this.handleActiveNodeChange(result);
                    break;
                default:
                    yield this.handleExternalUseCaseNotification(result);
            }
        });
    }
    establishSession() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Establishing session");
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            if (this.getAccessKey()) {
                headers.set('Authorization', 'Bearer ' + this.getAccessKey());
            }
            const postBody = {
                use_case_id: this.getAccessKey() ? undefined : this.use_case,
                client_data: this.use_case_data,
            };
            const url = this.platform_root + `/v1/use_case/${this.getAccessKey() ? 'session' : 'public_session'}`;
            try {
                const response = yield fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(postBody),
                    credentials: 'include',
                });
                if (!response.ok) {
                    yield this.reportError(response);
                    return;
                }
                const body = yield response.json();
                this.setRefreshToken(body.refresh_token);
                this.session_id = body.session_id;
            }
            catch (e) {
                this.reportErrorString('Error while establishing response', e.toString());
                throw e;
            }
            finally {
            }
        });
    }
    retrieveAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Retrieving access token for session ${this.session_id}`);
            if (!this.session_id) {
                this.reportErrorString("Error retrieving access token", "Session has not yet been established");
                return;
            }
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.set('Authorization', 'Bearer ' + this.getRefreshToken());
            try {
                const response = yield fetch(this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        include_http_only_cookie: this.allow_browser_to_manage_tokens
                    }),
                    credentials: 'include',
                });
                if (!response.ok) {
                    yield this.reportError(response);
                    return;
                }
                const body = yield response.json();
                if (!this.allow_browser_to_manage_tokens) {
                    this.setAccessToken(body.access_token);
                }
                this.calcAndSaveAccessTokenRefreshTime(body.access_token);
            }
            catch (e) {
                this.reportErrorString('Error while retrieving access token', e.toString());
                throw e;
            }
            finally {
            }
        });
    }
    refreshAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Refreshing access token for session ${this.session_id}`);
            if (!this.session_id) {
                this.reportErrorString("Error refreshing access token", "Session has not yet been established");
                return;
            }
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.set('Authorization', 'Bearer ' + this.getRefreshToken());
            try {
                const response = yield fetch(this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        include_http_only_cookie: this.allow_browser_to_manage_tokens
                    }),
                    credentials: 'include',
                });
                if (!response.ok) {
                    yield this.reportError(response);
                    return;
                }
                const body = yield response.json();
                if (!this.allow_browser_to_manage_tokens) {
                    this.setAccessToken(body.access_token);
                }
                this.calcAndSaveAccessTokenRefreshTime(body.access_token);
            }
            catch (e) {
                this.reportErrorString('Error while refreshing access token', e.toString());
                throw e;
            }
            finally {
            }
        });
    }
    retrieveUseCaseMetaData() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Fetching use case metadata');
            if (this.accessTokenExpired()) {
                yield this.refreshAccessToken();
            }
            const headers = this.getHeaders();
            try {
                const response = yield fetch(this.platform_root + '/v1/use_case/meta', {
                    method: 'GET',
                    headers: headers,
                    credentials: 'include',
                });
                if (!response.ok) {
                    yield this.reportError(response);
                    return;
                }
                const body = yield response.json();
                this.metadata = body.use_case;
            }
            catch (e) {
                this.reportErrorString('Error while retrieving use case metadata', e.toString());
                throw e;
            }
            finally {
            }
        });
    }
    calcAndSaveAccessTokenRefreshTime(refresh_token) {
        const decoded = (0,jwt_decode__WEBPACK_IMPORTED_MODULE_0__.jwtDecode)(refresh_token);
        if (!decoded.exp) {
            throw new Error("JWT missing exp claim");
        }
        const expiryTime = new Date(decoded.exp * 1000);
        const now = Date.now();
        const refresh_access_token_period = Math.floor((expiryTime.getTime() - now) * 0.7);
        const refreshTime = new Date(now + refresh_access_token_period);
        this.setAccessTokenRefreshTime(refreshTime);
    }
    handleStreamedFragment(fragment) {
        return __awaiter(this, void 0, void 0, function* () {
            this.streamFragmentHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(fragment);
            }));
        });
    }
    handleLLMStats(stats) {
        return __awaiter(this, void 0, void 0, function* () {
            this.llmStatsHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(stats);
            }));
        });
    }
    handleError(error) {
        return __awaiter(this, void 0, void 0, function* () {
            this.errorHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(error);
            }));
        });
    }
    handleExternalUseCaseNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            this.useCaseNotificationHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(notification);
            }));
        });
    }
    handleActiveNodeChange(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            this.useCaseActiveNodeChangeNotificationHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(notification);
            }));
        });
    }
    reportError(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const error = yield response.json();
            const errorText = `${response.statusText}:${error.message || error.detail}`;
            this.handleError(errorText);
            // throw new Error(errorText);
        });
    }
    reportErrorString(error, message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.handleError(`${error} - ${message}`);
            // throw new Error(`${error} - ${message}`);
        });
    }
}

/******/ 	return __webpack_exports__;
/******/ })()
;
});