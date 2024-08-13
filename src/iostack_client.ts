import { jwtDecode } from 'jwt-decode';

type Closure = {
    refresh_token: string
    access_token: string
    access_key: string
    access_token_refresh_time: Date
}

interface ClientNotificationPacket {
    type: string;
}

export interface StreamFragmentPacket extends ClientNotificationPacket {
    fragment: string;
}

export interface EntityReferencePacket extends ClientNotificationPacket {
    name: string;
    value: Record<string, any>;
}

export interface LLMStatsPacket extends ClientNotificationPacket {
    total_cost: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
}

export interface UseCaseNotificationPacket extends ClientNotificationPacket {
    name: string;
    data: Record<string, any>
}

export interface StreamingErrorPacket extends ClientNotificationPacket {
    error: string;
    message: string
}

type StreamFragmentHandler = (fragment: StreamFragmentPacket) => Promise<void>
type LLMStatsHandler = (stats: LLMStatsPacket) => Promise<void>
type ErrorHandler = (error: string) => Promise<void>
type UseCaseNoficationHandler = (notification: UseCaseNotificationPacket) => Promise<void>

export class iostackClient {

    private platform_root: string;
    private use_case: string | null;
    private use_case_data: Record<string, any>;
    private session_id: string | null;
    private metadata: any | null;
    private trigger_prompt: string;
    private decoder: TextDecoder;
    private allow_browser_to_manage_tokens: boolean;

    private streamFragmentHandlers: StreamFragmentHandler[];
    private llmStatsHandlers: LLMStatsHandler[];
    private errorHandlers: ErrorHandler[];
    private useCaseNotificationHandlers: UseCaseNoficationHandler[];

    private setRefreshToken: (i: string) => void;
    private getRefreshToken: () => string;
    private setAccessToken: (i: string) => void;
    private getAccessToken: () => string;
    private getAccessKey: () => string;

    private setAccessTokenRefreshTime: (i: Date) => void;
    private getAccessTokenRefreshTime: () => Date;

    constructor({
        access_key,
        use_case_data,
        allow_browser_to_manage_tokens,
        use_case,
        platform_root,
    } : {
        access_key: string,
        use_case_data: Record<string, any>,
        allow_browser_to_manage_tokens: boolean,
        use_case?: string | undefined,
        platform_root?: string | undefined,
    }) {

        this.platform_root = platform_root || "https://platform.iostack.ai";
        this.use_case = use_case || "";
        this.use_case_data = use_case_data
        this.allow_browser_to_manage_tokens = allow_browser_to_manage_tokens
        this.session_id = null;
        this.metadata = null;
        this.trigger_prompt = "";
        this.streamFragmentHandlers = []
        this.llmStatsHandlers = []
        this.errorHandlers = []
        this.useCaseNotificationHandlers = []

        this.decoder = new TextDecoder();

        // Set up a closure for sensitive data

        const closure: Closure = {
            refresh_token: "",
            access_token: "",
            access_key: access_key,
            access_token_refresh_time: new Date(0)
        }

        this.setRefreshToken = function (i) { closure.refresh_token = i }
        this.getRefreshToken = function () { return closure.refresh_token }

        this.setAccessToken = function (i) { 
            if(this.allow_browser_to_manage_tokens){
                throw new Error("Shouldn't be saving access token if the user has requested that the browser should handle it automatically")
            }
            closure.access_token = i 
        }
        this.getAccessToken = function () { 
            if(this.allow_browser_to_manage_tokens){
                throw new Error("Shouldn't be retrieving access token if the user has requested that the browser should handle it automatically")
            }
            return closure.access_token 
        }

        this.getAccessKey = function () { return closure.access_key }

        this.setAccessTokenRefreshTime = function (i: Date) { closure.access_token_refresh_time = i }
        this.getAccessTokenRefreshTime = function (): Date { return closure.access_token_refresh_time }

    }

    public registerStreamFragmentHandler(h: StreamFragmentHandler): void {
        this.streamFragmentHandlers.push(h)
    }

    public registerLLMStatsHandler(h: LLMStatsHandler): void {
        this.llmStatsHandlers.push(h)
    }

    public registerErrorHandler(h: ErrorHandler): void {
        this.errorHandlers.push(h)
    }

    public registerUseCaseNotificationHandler(h: UseCaseNoficationHandler): void {
        this.useCaseNotificationHandlers.push(h)
    }

    public async startSession() {
        await this.establishSession();
        await this.retrieveAccessToken();
        await this.retrieveUseCaseMetaData();
        await this.sendMessageAndStreamResponse(this.trigger_prompt)
    }

    public async sendMessageAndStreamResponse(message: string): Promise<void> {

        if (new Date(Date.now()) >= this.getAccessTokenRefreshTime()) {
            await this.refreshAccessToken();
        }

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        if (!this.allow_browser_to_manage_tokens) {
            headers.set('Authorization', 'Bearer ' + this.getAccessToken());
        }

        const postBody = {
            message: message,
        };

        try {

            const response: Response = await fetch(this.platform_root + `/v1/use_case/session/${this.session_id}/stream`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(postBody),
                credentials: !this.allow_browser_to_manage_tokens ? 'omit' : 'include',
            });

            if (!response.ok || !response.body) {
                await this.reportError(response);
                return;
            }

            const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader();

            const lambda = async (message: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
                if (message.done) {
                    return;
                }

                await this.processMessage(message);
                return reader.read().then(lambda);
            };

            await reader.read().then(lambda);

        } catch (e:any) {
            this.reportErrorString(
                'Error while initiating streaming response',
                e.toString()
            );
        } finally {
        }
    }

    private async processMessage(message: ReadableStreamReadResult<Uint8Array>) {

        if (message.done) {
            return;
        }

        const streamedResponsesString = this.decoder.decode(message.value, { stream: true });
        const streamResponseStrings = streamedResponsesString.split('__|__');

        for (const streamedResponseString of streamResponseStrings) {
            await this.handleStreamingResponse(streamedResponseString)
        }
    }

    private async handleStreamingResponse(streamedResponseString: string) {

        if (!streamedResponseString) return;

        const streamedResponse: ClientNotificationPacket = JSON.parse(streamedResponseString);

        switch (streamedResponse.type) {
            case 'fragment':
                await this.handleStreamedFragment(streamedResponse as StreamFragmentPacket)
                break;

            case 'error':
                await this.handleError((streamedResponse as StreamingErrorPacket).error);
                break;

            case 'llm_stats':
                await this.handleLLMStats(streamedResponse as LLMStatsPacket);
                break;

            case 'use_case_notification':
                await this.handleUseCaseNotification(streamedResponse as UseCaseNotificationPacket);
                break;

            default:
                console.log(
                    'Unknown streaming packet seen:\n' + streamedResponseString
                );
        }
    }

    private async handleUseCaseNotification(result: UseCaseNotificationPacket) {

        switch (result.name) {
            case 'graph_active_node_change':
                break;

            default:
                await this.handleExternalUseCaseNotification(result);
        }
    }

    private async establishSession() {

        // console.log('Establishing session');

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + this.getAccessKey());

        const postBody = {
            tenant_id: "",
            user_id: "",
            client_data: this.use_case_data,
        };

        const url = this.platform_root + '/v1/use_case/session'
        const response = await fetch(
            url,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(postBody),
                credentials: 'include',
            }
        )

        if (!response.ok) {
            await this.reportError(response)
            return
        }

        const body = await response.json();
        this.setRefreshToken(body.refresh_token);
        this.session_id = body.session_id;

    }

    private async retrieveAccessToken() {

        console.log('Retrieving access token');

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + this.getRefreshToken());

        const response = await fetch(
            this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    include_http_only_cookie: this.allow_browser_to_manage_tokens
                }),
                credentials: 'include',
            }
        )

        if (!response.ok) {
            await this.reportError(response)
            return
        }

        const body = await response.json();

        this.setAccessToken(body.access_token)
        this.calcAndSaveAccessTokenRefreshTime(body.access_token);
    }

    private async refreshAccessToken() {

        console.log('Refreshing access token');

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + this.getRefreshToken());

        const response = await fetch(
            this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    return_cookie: this.allow_browser_to_manage_tokens
                }),
                credentials: 'include',
            }
        )

        if (!response.ok) {
            await this.reportError(response)
            return
        }

        const body = await response.json();

        this.setAccessToken(body.access_token);
        this.calcAndSaveAccessTokenRefreshTime(body.access_token);

    }

    private async retrieveUseCaseMetaData() {

        console.log('Fetching use case metadata');

        if (new Date(Date.now()) >= this.getAccessTokenRefreshTime()) {
            await this.refreshAccessToken();
        }

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        if (!this.allow_browser_to_manage_tokens) {
            headers.set('Authorization', 'Bearer ' + this.getAccessToken());
        }

        const response = await fetch(this.platform_root + '/v1/use_case/meta', {
            method: 'GET',
            headers: headers,
            credentials: 'include',
        })

        if (!response.ok) {
            await this.reportError(response)
            return
        }

        const body = await response.json();

        this.metadata = body.use_case
        this.trigger_prompt = body.use_case.trigger_phrase;

    }

    private calcAndSaveAccessTokenRefreshTime(refresh_token: string) {
        const decoded = jwtDecode(refresh_token);
        if (!decoded.exp) {
            throw new Error("JWT missing exp claim")
        }
        const expiryTime = new Date(decoded.exp * 1000);
        const now = Date.now();
        const refresh_access_token_period = Math.floor(
            (expiryTime.getTime() - now) * 0.7
        );
        const refreshTime = new Date(now + refresh_access_token_period);
        this.setAccessTokenRefreshTime(refreshTime);
    }

    private async handleStreamedFragment(fragment: StreamFragmentPacket) {
        this.streamFragmentHandlers.forEach(async h => {
            await h(fragment)
        })
    }

    private async handleLLMStats(stats: LLMStatsPacket) {
        this.llmStatsHandlers.forEach(async h => {
            await h(stats)
        })
    }

    private async handleError(error: string) {
        this.errorHandlers.forEach(async h => {
            await h(error)
        })
    }

    private async handleExternalUseCaseNotification(notification: UseCaseNotificationPacket) {
        this.useCaseNotificationHandlers.forEach(async h => {
            await h(notification)
        })
    }

    private async reportError(response: Response): Promise<never> {
        const error = await response.json();
        const errorText = `${response.statusText}:${error.message || error.detail}`;
        this.handleError(errorText)
        throw new Error(errorText);
    }

    private async reportErrorString(error: string, message: string): Promise<never> {
        this.handleError(`${error} - ${message}`)
        throw new Error(`${error} - ${message}`);
    }


}