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
/* harmony export */   newIOStackClient: () => (/* binding */ newIOStackClient)
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

class IOStackAbortHandler {
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
function newIOStackClient(args) {
    return new ClientConstructor(args);
}
function ClientConstructor(args) {
    this.platform_root = args.platform_root || "https://platform.iostack.ai";
    this.use_case_data = args.use_case_data || {};
    this.session_id = null;
    this.snapshot_id = args.snapshot_id || null;
    this.streamFragmentHandlers = [];
    this.llmStatsHandlers = [];
    this.errorHandlers = [];
    this.useCaseNotificationHandlers = [];
    this.useCaseActiveNodeChangeNotificationHandlers = [];
    this.useCaseStreamedReferenceNotificationHandlers = [];
    this.stream_post_data_addenda = {};
    this.metadata_list = args.metadata_list || ["trigger_phrase"];
    this.decoder = new TextDecoder();
    this.metadata = null;
    // Set up a closure for sensitive data
    const closure = {
        refresh_token: "",
        access_token: "",
        access_key: args.access_key,
        access_token_refresh_time: new Date(0)
    };
    const setRefreshToken = function (i) { closure.refresh_token = i; };
    const getRefreshToken = function () { return closure.refresh_token; };
    const setAccessToken = function (i) { closure.access_token = i; };
    const getAccessToken = function () { return closure.access_token; };
    const getAccessKey = function () { return closure.access_key; };
    const setAccessTokenRefreshTime = function (i) { closure.access_token_refresh_time = i; };
    const accessTokenExpired = function () { return !!closure.access_token_refresh_time && new Date(Date.now()) >= closure.access_token_refresh_time; };
    this.deregisterAllHandlers = function () {
        this.streamFragmentHandlers = [];
        this.llmStatsHandlers = [];
        this.errorHandlers = [];
        this.useCaseNotificationHandlers = [];
        this.useCaseActiveNodeChangeNotificationHandlers = [];
        this.useCaseStreamedReferenceNotificationHandlers = [];
    };
    this.registerStreamFragmentHandler = function (h) {
        this.streamFragmentHandlers.push(h);
    };
    this.registerLLMStatsHandler = function (h) {
        this.llmStatsHandlers.push(h);
    };
    this.registerErrorHandler = function (h) {
        this.errorHandlers.push(h);
    };
    this.registerUseCaseNotificationHandler = function (h) {
        this.useCaseNotificationHandlers.push(h);
    };
    this.registerUseCaseStreamReferenceNotificationHandler = function (h) {
        this.useCaseStreamedReferenceNotificationHandlers.push(h);
    };
    this.registerUseCaseActiveNodeChangeNotificationHandler = function (h) {
        this.useCaseActiveNodeChangeNotificationHandlers.push(h);
    };
    this.getTriggerPrompt = function () {
        if (!this.metadata) {
            this.reportErrorString("Can't retrieve trigger prompt", "Metadata not retrieved");
            return "";
        }
        return this.metadata.trigger_phrase;
    };
    this.startSession = function () {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.snapshot_id) {
                    const data = yield this.establishSessionFromSnapshot();
                    this.snapshot_id = null;
                    if (!data)
                        return;
                    yield this.retrieveAccessToken();
                    if (this.metadata_list.length > 0) {
                        yield this.retrieveUseCaseMetaData();
                    }
                    yield this.handleUseCaseNotification(data);
                    return;
                }
                yield this.establishSession();
                yield this.retrieveAccessToken();
                if (this.metadata_list.length > 0) {
                    yield this.retrieveUseCaseMetaData();
                    if (this.metadata.trigger_phrase) {
                        yield this.sendMessageAndStreamResponse(this.metadata.trigger_phrase);
                    }
                }
            }
            finally {
                // All errors and exceptions should have been reported via the callback
            }
        });
    };
    this.getHeaders = function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (accessTokenExpired()) {
                yield this.refreshAccessToken();
            }
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.set('Authorization', 'Bearer ' + getAccessToken());
            return headers;
        });
    };
    this.sendMessageAndStreamResponse = function (message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message) {
                return;
            }
            if (!this.session_id) {
                this.reportErrorString("Error sending message", "Session has not yet been established");
                return;
            }
            const headers = yield this.getHeaders();
            const postBody = Object.assign({ message: message }, this.stream_post_data_addenda);
            const abortHandler = new IOStackAbortHandler(60 * 1000);
            try {
                const response = yield fetch(this.platform_root + `/v1/use_case/session/${this.session_id}/stream`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(postBody),
                    signal: abortHandler.getSignal()
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
                abortHandler.reset();
            }
        });
    };
    this.processMessage = function (message) {
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
    };
    this.handleStreamingResponse = function (streamedResponseString) {
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
                case 'streamed_ref':
                    yield this.handleUseCaseStreamedReferenceNotification(streamedResponse);
                    break;
                default:
                    console.log('Unknown streaming packet seen:\n' + streamedResponseString);
            }
        });
    };
    this.handleUseCaseNotification = function (result) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (result.name) {
                case 'graph_active_node_change':
                    yield this.handleActiveNodeChange(result);
                    break;
                default:
                    yield this.handleExternalUseCaseNotification(result);
            }
        });
    };
    this.establishSession = function () {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Establishing session");
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.set('Authorization', 'Bearer ' + getAccessKey());
            const postBody = {
                use_case_id: getAccessKey(),
                client_data: this.use_case_data,
            };
            const url = this.platform_root + `/v1/use_case/session`;
            const abortHandler = new IOStackAbortHandler(30 * 1000);
            try {
                const response = yield fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(postBody),
                    signal: abortHandler.getSignal()
                });
                if (!response.ok) {
                    yield this.reportError(response);
                    return;
                }
                const body = yield response.json();
                setRefreshToken(body.refresh_token);
                this.session_id = body.session_id;
            }
            catch (e) {
                this.reportErrorString('Error while establishing response', e.toString());
                throw e;
            }
            finally {
                abortHandler.reset();
            }
        });
    };
    this.establishSessionFromSnapshot = function () {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Establishing session");
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.set('Authorization', 'Bearer ' + getAccessKey());
            const postBody = {
                source_snapshot_id: this.snapshot_id
            };
            const url = this.platform_root + `/v1/use_case/snapshot/session`;
            const abortHandler = new IOStackAbortHandler(30 * 1000);
            try {
                const response = yield fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(postBody),
                    signal: abortHandler.getSignal()
                });
                if (!response.ok) {
                    yield this.reportError(response);
                    return null;
                }
                const body = yield response.json();
                setRefreshToken(body.refresh_token);
                this.session_id = body.response.session_id;
                return {
                    name: "snapshot_session_created",
                    data: body.response
                };
            }
            catch (e) {
                this.reportErrorString('Error while establishing session from snapshot', e.toString());
                throw e;
            }
            finally {
                abortHandler.reset();
            }
        });
    };
    this.retrieveAccessToken = function () {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Retrieving access token for session ${this.session_id}`);
            if (!this.session_id) {
                this.reportErrorString("Error retrieving access token", "Session has not yet been established");
                return;
            }
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.set('Authorization', 'Bearer ' + getRefreshToken());
            const abortHandler = new IOStackAbortHandler(30 * 1000);
            try {
                const response = yield fetch(this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`, {
                    method: 'POST',
                    headers: headers,
                    body: "{}",
                    signal: abortHandler.getSignal()
                });
                if (!response.ok) {
                    yield reportError(response);
                    return;
                }
                const body = yield response.json();
                setAccessToken(body.access_token);
                calcAndSaveAccessTokenRefreshTime(body.access_token);
            }
            catch (e) {
                this.reportErrorString('Error while retrieving access token', e.toString());
                throw e;
            }
            finally {
                abortHandler.reset();
            }
        });
    };
    this.refreshAccessToken = function () {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Refreshing access token for session ${this.session_id}`);
            if (!this.session_id) {
                this.reportErrorString("Error refreshing access token", "Session has not yet been established");
                return;
            }
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.set('Authorization', 'Bearer ' + getRefreshToken());
            const abortHandler = new IOStackAbortHandler(30 * 1000);
            try {
                const response = yield fetch(this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`, {
                    method: 'POST',
                    headers: headers,
                    body: "{}",
                    signal: abortHandler.getSignal()
                });
                if (!response.ok) {
                    yield reportError(response);
                    return;
                }
                const body = yield response.json();
                setAccessToken(body.access_token);
                calcAndSaveAccessTokenRefreshTime(body.access_token);
            }
            catch (e) {
                this.reportErrorString('Error while refreshing access token', e.toString());
                throw e;
            }
            finally {
                abortHandler.reset();
            }
        });
    };
    this.retrieveUseCaseMetaData = function () {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Fetching use case metadata');
            const headers = yield this.getHeaders();
            const abortHandler = new IOStackAbortHandler(30 * 1000);
            let url = this.platform_root + '/v1/use_case/meta';
            if (this.metadata_list.length > 0)
                url = `${url}?details=${this.metadata_list.join("&details=")}`;
            try {
                const response = yield fetch(url, {
                    method: 'GET',
                    headers: headers,
                    signal: abortHandler.getSignal()
                });
                if (!response.ok) {
                    yield reportError(response);
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
                abortHandler.reset();
            }
        });
    };
    const calcAndSaveAccessTokenRefreshTime = function (refresh_token) {
        const decoded = (0,jwt_decode__WEBPACK_IMPORTED_MODULE_0__.jwtDecode)(refresh_token);
        if (!decoded.exp) {
            throw new Error("JWT missing exp claim");
        }
        const expiryTime = new Date(decoded.exp * 1000);
        const now = Date.now();
        const refresh_access_token_period = Math.floor((expiryTime.getTime() - now) * 0.7);
        const refreshTime = new Date(now + refresh_access_token_period);
        setAccessTokenRefreshTime(refreshTime);
    };
    this.handleStreamedFragment = function (fragment) {
        return __awaiter(this, void 0, void 0, function* () {
            this.streamFragmentHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(fragment);
            }));
        });
    };
    this.handleLLMStats = function (stats) {
        return __awaiter(this, void 0, void 0, function* () {
            this.llmStatsHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(stats);
            }));
        });
    };
    this.handleError = function (error) {
        return __awaiter(this, void 0, void 0, function* () {
            this.errorHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(error);
            }));
        });
    };
    this.handleExternalUseCaseNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function* () {
            this.useCaseNotificationHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(notification);
            }));
        });
    };
    this.handleUseCaseStreamedReferenceNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function* () {
            this.useCaseStreamedReferenceNotificationHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(notification);
            }));
        });
    };
    this.handleActiveNodeChange = function (notification) {
        return __awaiter(this, void 0, void 0, function* () {
            this.useCaseActiveNodeChangeNotificationHandlers.forEach((h) => __awaiter(this, void 0, void 0, function* () {
                yield h(notification);
            }));
        });
    };
    this.reportError = function (response) {
        return __awaiter(this, void 0, void 0, function* () {
            const error = yield response.json();
            const errorText = `${response.statusText}:${error.message || error.detail}`;
            yield this.handleError(errorText);
            // throw new Error(errorText);
        });
    };
    this.reportErrorString = function (error, message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handleError(`${error} - ${message}`);
            // throw new Error(`${error} - ${message}`);
        });
    };
}

/******/ 	return __webpack_exports__;
/******/ })()
;
});