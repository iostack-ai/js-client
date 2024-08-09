import { jwtDecode } from 'jwt-decode';

export class Client {

    constructor(
        access_key,
        use_case = null,
        platform_root = null,
    ) {

        this.platform_root = platform_root || "https://platform.iostack.ai";
        this.use_case = use_case;
        this.session_id = null;
        this.metadata = null;
        this.trigger_prompt = null;

        this.decoder = new TextDecoder();

        // Set up a closure for sensitive data

        let refresh_token = null;
        let access_key = access_key
        let access_token_refresh_time = null;

        this.setRefreshToken = function(i) { refresh_token = i }
        this.getRefreshToken = function() { return refresh_token }

        this.getAccessKey = function() { return access_key }

        this.setAccessTokenRegreshTime = function(i) { access_token_refresh_time = i }
        this.getAccessTokenRegreshTime = function() { return access_token_refresh_time }

    }

    async handleStreamedToken(token) {}
    async handleStreamingError(message, error) {}
    async handle_focus_ref(result) {}
    async handle_streamed_ref(result) {}
    async handle_use_case_state(state) {}
    async handle_use_case_specific_notification(result) {}

    #reportError(response, error) {
        throw new Error(`${response.statusText} - ${error.error}:${error.message}`);
    }

    async startSession() {
        await this.#establishSession();
        await this.#retrieveAccessToken();
        await this.#retrieveUseCaseMetaData();
        await this.sendMessageAndStreamResponse(this.trigger_prompt)
    }

    async sendMessageAndStreamResponse(message) {

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const postBody = {
            message: message,
        };

        await fetch(this.platform_root + `/v1/use_case/session/${this.snapshotHarness.getSessionId()}/stream`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(postBody),
            credentials: 'include',
        })
            .then(async response => {

                if (!response.ok) {
                    const error = await response.json();
                    this.#reportError(response, error)
                    return
                }
    
                const reader = response.body.getReader();

                const lambda = async message => {
                    if (message.done) {
                        return;
                    }

                    await this.#processMessage(message);
                    return reader.read().then(lambda);
                };

                reader
                    .read()
                    .then(lambda)
                    .catch(error => {
                        this.handleStreamingError('Error while streaming response',error.message);
                    })
                    .finally(() => {
                    });
            })
            .catch(e => {
                this.showError(
                    'Error while initiating streaming response',
                    e.message
                );
            })
            .finally(() => {
                console.log("sendMessageAndStreamResponse completed")
            });
    }

    async #processMessage(message) {

        if (message.done) {
            return;
        }

        const streamedResponsesString = this.decoder.decode(message.value, { stream: true });
        const streamResponseStrings = streamedResponsesString.split('__|__');

        for(const streamedResponseString of streamResponseStrings) {
            await this.#handleStreamingResponse(streamedResponseString)
        }
    }

    async #handleStreamingResponse(streamedResponseString) {

        if (!streamedResponseString) return;

        const streamedResponse = JSON.parse(streamedResponseString);

        switch (streamedResponse.type) {
            case 'token':
                await this.handleStreamedToken(streamedResponse.token)
                break;

            case 'error':
                await this.handleStreamingError('Error while streaming response', streamedResponse.error);
                break;

            case 'focus_ref':
                this.handle_focus_ref(streamedResponse);
                break;

            case 'streamed_ref':
                this.handle_streamed_ref(streamedResponse);
                break;

            case 'llm_stats':
                this.updateStats(streamedResponse);
                break;

            case 'use_case_notification':
                this.#handle_use_case_notification(streamedResponse);
                break;

            default:
                console.log(
                    'Unknown streaming packet seen:\n' + streamedResponseString
                );
        }
    }

    async #handle_use_case_notification(result) {

        switch (result.name) {
            case 'graph_active_node_change':
                break;

            default:
                await this.handle_use_case_specific_notification(result);
        }
    }

    async #establishSession() {

        console.log('Establishing session');

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + this.getAccessKey());

        const postBody = {
            tenant_id: "",
            user_id: "",
            client_data: {},
        };

        const response = await fetch(
            this.platform_root + '/v1/use_case/session',
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(postBody),
                credentials: 'include',
            }
        )

        if (!response.ok) {
            const error = await response.json();
            this.#reportError(response, error)
            return
        }

        const body = await response.json();
        this.setRefreshToken(body.refresh_token);
        this.session_id = body.session_id;

    }

    async #retrieveAccessToken() {

        console.log('Retrieving access token');

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + this.getRefreshToken());

        const response = await fetch(
            this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ include_http_only_cookie: true }),
                credentials: 'include',
            }
        )

        if (!response.ok) {
            const error = await response.json();
            this.#reportError(response, error)
        }

        const body = await response.json();

        this.#calcAndSaveAccessTokenRefreshTime(body.access_token);
    }

    async #refreshAccessToken() {

        console.log('Refreshing access token');

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + this.getRefreshToken());

        const response = await fetch(
            this.platform_root + `/v1/use_case/session/${this.snapshotHarness.getSessionId()}/access_token`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ return_cookie: true }),
                credentials: 'include',
            }
        )

        if (!response.ok) {
            const error = await response.json();
            this.#reportError(response, error)
        }

        const body = await response.json();

        this.#calcAndSaveAccessTokenRefreshTime(response.access_token);

    }

    async #retrieveUseCaseMetaData() {

        console.log('Fetching use case metadata');

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const response = await fetch(this.platform_root + '/v1/use_case/meta', {
            method: 'GET',
            headers: headers,
            credentials: 'include',
        })

        if (!response.ok) {
            const error = await response.json();
            this.#reportError(response, error)
        }

        const body = await response.json();

        this.metadata = body.use_case
        this.trigger_prompt = body.use_case.trigger_phrase;

    }

    #calcAndSaveAccessTokenRefreshTime(refresh_token) {
        const decoded = jwtDecode(refresh_token);
        const expiryTime = new Date(decoded.exp * 1000);
        const now = Date.now();
        const refresh_access_token_period = Math.floor(
            (expiryTime.getTime() - now) * 0.7
        );
        const refreshTime = new Date(now + refresh_access_token_period);
        this.setAccessTokenRegreshTime(refreshTime);
    }

}
