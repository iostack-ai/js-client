import { jwtDecode } from 'jwt-decode';

type Closure = {
    refresh_token: string
    access_token: string
    access_key: string
    access_token_refresh_time: Date|null
    refresh_token_refresh_time: Date|null
}

interface ClientNotificationPacket {
    type: string;
}

export interface StreamFragmentPacket extends ClientNotificationPacket {
    fragment: string;
    final: boolean;
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
}

export interface StreamedReferenceNotificationPacket extends ClientNotificationPacket {
    name: string;
    value: Record<string, any>;
}

export interface SessionStateUpdateNotificationPacket extends UseCaseNotificationPacket {
    data: Record<string, any>;
}

export interface UseCaseActiveNodeChangePayload {
    active_node: string
    active_node_code: string
    assembly?: Record<string, any>|undefined
}

export interface UseCaseActiveNodeChangeNotification extends ClientNotificationPacket {
    data: UseCaseActiveNodeChangePayload
}

export interface StreamingErrorPacket extends ClientNotificationPacket {
    error: string;
    message: string
}

export type StreamFragmentHandler = (fragment: StreamFragmentPacket) => Promise<void>
export type ErrorHandler = (error: string) => Promise<void>
export type LLMStatsHandler = (stats: LLMStatsPacket) => Promise<void>

export type UseCaseNoficationHandler = (notification: UseCaseNotificationPacket) => Promise<void>
export type UseCaseActiveNodeChangeNotificationHandler = (notification: UseCaseActiveNodeChangeNotification) => Promise<void>
export type StreamedReferenceNotificationHandler = (notification: StreamedReferenceNotificationPacket) => Promise<void>

export class IOStackAbortHandler {

    private controller:AbortController;
    private signal:AbortSignal;
    private timeoutId:NodeJS.Timeout;

    constructor(timeoutInMillis:number) {
        this.controller = new AbortController();
        this.signal = this.controller.signal;
        this.timeoutId = setTimeout(() => this.controller.abort(), timeoutInMillis);
    }

    getSignal() {
        return this.signal
    }

    reset() {
        clearTimeout(this.timeoutId)
    }

}

export interface IOStackClient {

    platform_root:string;
    stream_post_data_addenda:{};

    use_case_data:{};
    session_id:string|null;
    streamFragmentHandlers:StreamFragmentHandler[];
    llmStatsHandlers:LLMStatsHandler[];
    errorHandlers:ErrorHandler[];
    useCaseNotificationHandlers:UseCaseNoficationHandler[];
    useCaseActiveNodeChangeNotificationHandlers:UseCaseActiveNodeChangeNotificationHandler[];
    useCaseStreamedReferenceNotificationHandlers:StreamedReferenceNotificationHandler[];
    metadata_list:string[];
    decoder:TextDecoder;
    metadata:Record<string, any>|null;

    deregisterAllHandlers(): void;
    registerStreamFragmentHandler(h: StreamFragmentHandler): void;
    registerLLMStatsHandler(h: LLMStatsHandler): void;
    registerErrorHandler(h: ErrorHandler): void;
    registerUseCaseNotificationHandler(h: UseCaseNoficationHandler): void;
    registerUseCaseStreamReferenceNotificationHandler(h: StreamedReferenceNotificationHandler): void;
    registerUseCaseActiveNodeChangeNotificationHandler(h: UseCaseActiveNodeChangeNotificationHandler): void;

    getTriggerPrompt(): string;

    startSession(): Promise<void>;
    sendMessageAndStreamResponse(message: string): Promise<void>;

    reportError(response: Response): Promise<void>;

    getHeaders(): Promise<Headers>;

    establishSession(): Promise<void>;
    retrieveAccessToken(): Promise<void>;
    setRefreshToken(i:string): void;

    processMessage(message: ReadableStreamReadResult<Uint8Array>): Promise<void>;

    handleStreamingResponse(streamedResponseString: string): Promise<void>;
    handleUseCaseNotification(result: UseCaseNotificationPacket): Promise<void>;

    handleStreamedFragment(fragment: StreamFragmentPacket): Promise<void>;
    handleLLMStats(stats: LLMStatsPacket): Promise<void>;
    handleError(error: string): Promise<void>;
    handleExternalUseCaseNotification(notification: UseCaseNotificationPacket): Promise<void>;
    handleUseCaseStreamedReferenceNotification(notification: StreamedReferenceNotificationPacket): Promise<void>;
    handleActiveNodeChange(notification: UseCaseActiveNodeChangeNotification): Promise<void>;

    refreshAccessToken(): Promise<void>;
    refreshRefreshToken():Promise<void>;
    retrieveUseCaseMetaData(): Promise<void>;

    reportErrorString(error: string, message: string): Promise<void>;

}

export type ClientConstructorArgs = {
    access_key: string,
    use_case_data?: Record<string, any> | undefined,
    platform_root?: string | undefined,
    metadata_list?: string[] | undefined
}

export function newIOStackClient(args: ClientConstructorArgs): IOStackClient {
    return new (IOStackClientConstructor as any)(args)
}

export function IOStackClientConstructor (
    this: IOStackClient,
    args : ClientConstructorArgs
) {

    this.platform_root = args.platform_root || "https://platform.iostack.ai";
    this.use_case_data = args.use_case_data || {};
    this.session_id = null;
    this.streamFragmentHandlers = [];
    this.llmStatsHandlers = [];
    this.errorHandlers = [];
    this.useCaseNotificationHandlers = [];
    this.useCaseActiveNodeChangeNotificationHandlers = []
    this.useCaseStreamedReferenceNotificationHandlers = []
    this.stream_post_data_addenda = {}
    this.metadata_list = args.metadata_list || ["trigger_phrase"]
    this.decoder = new TextDecoder();
    this.metadata = null;

    // Set up a closure for sensitive data

    const closure: Closure = {
        refresh_token: "",
        access_token: "",
        access_key: args.access_key,
        access_token_refresh_time: new Date(0),
        refresh_token_refresh_time: new Date(0)
    }

    const setRefreshToken = function (i: string) { closure.refresh_token = i }
    const getRefreshToken = function () { return closure.refresh_token }
    const setAccessToken = function (i: string) { closure.access_token = i }
    const getAccessToken = function () { return closure.access_token }
    const getAccessKey = function () { return closure.access_key }
    const setAccessTokenRefreshTime = function (i: Date) { closure.access_token_refresh_time = i }
    const accessTokenExpired = function (): boolean { return !!closure.access_token_refresh_time && new Date(Date.now()) >= closure.access_token_refresh_time }
    const setRefreshTokenRefreshTime = function (i: Date) { closure.refresh_token_refresh_time = i }
    const refreshTokenExpired = function (): boolean { return !!closure.refresh_token_refresh_time && new Date(Date.now()) >= closure.refresh_token_refresh_time }

    this.setRefreshToken = function(i:string): void {
        setRefreshToken(i)
        calcAndSaveRefreshTokenRefreshTime(i);
    }

    this.deregisterAllHandlers = function (): void {
        this.streamFragmentHandlers = []
        this.llmStatsHandlers = []
        this.errorHandlers = []
        this.useCaseNotificationHandlers = []
        this.useCaseActiveNodeChangeNotificationHandlers = []
        this.useCaseStreamedReferenceNotificationHandlers = []
    }

    this.registerStreamFragmentHandler = function(h: StreamFragmentHandler): void {
        this.streamFragmentHandlers.push(h)
    }

    this.registerLLMStatsHandler = function(h: LLMStatsHandler): void {
        this.llmStatsHandlers.push(h)
    }

    this.registerErrorHandler = function(h: ErrorHandler): void {
        this.errorHandlers.push(h)
    }

    this.registerUseCaseNotificationHandler = function(h: UseCaseNoficationHandler): void {
        this.useCaseNotificationHandlers.push(h)
    }

    this.registerUseCaseStreamReferenceNotificationHandler = function(h: StreamedReferenceNotificationHandler): void {
        this.useCaseStreamedReferenceNotificationHandlers.push(h)
    }

    this.registerUseCaseActiveNodeChangeNotificationHandler = function(h: UseCaseActiveNodeChangeNotificationHandler): void {
        this.useCaseActiveNodeChangeNotificationHandlers.push(h)
    }

    this.getTriggerPrompt = function(): string {
        if(!this.metadata) {
            this.reportErrorString("Can't retrieve trigger prompt", "Metadata not retrieved")
            return ""
        }
        return this.metadata.trigger_phrase
    }

    this.getHeaders = async function(): Promise<Headers> {

        if(refreshTokenExpired()) {
            await this.refreshRefreshToken();
        }

        if(accessTokenExpired()) {
            await this.refreshAccessToken();
        }

        const headers = new Headers();
        
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + getAccessToken());

        return headers
    }

    this.processMessage = async function(message: ReadableStreamReadResult<Uint8Array>): Promise<void> {

        if (message.done) {
            return;
        }

        const streamedResponsesString = this.decoder.decode(message.value, { stream: true });
        const streamResponseStrings = streamedResponsesString.split('__|__');

        for (const streamedResponseString of streamResponseStrings) {
            await this.handleStreamingResponse(streamedResponseString)
        }
    }

    this.handleStreamingResponse = async function(streamedResponseString: string): Promise<void> {

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

            case 'streamed_ref':
                await this.handleUseCaseStreamedReferenceNotification(streamedResponse as StreamedReferenceNotificationPacket);
                break

            default:
                console.log(
                    'Unknown streaming packet seen:\n' + streamedResponseString
                );
        }
    }

    this.handleUseCaseNotification = async function(result: UseCaseNotificationPacket): Promise<void> {

        switch (result.name) {
            case 'graph_active_node_change':
                await this.handleActiveNodeChange(result as unknown as UseCaseActiveNodeChangeNotification)
                break;

            default:
                await this.handleExternalUseCaseNotification(result);
        }
    }

    this.establishSession = async function(): Promise<void> {

        console.log("Establishing session")

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + getAccessKey());

        const postBody = {
            use_case_id: getAccessKey(),
            client_data: this.use_case_data,
        };

        const url = this.platform_root + `/v1/use_case/session`

        const abortHandler = new IOStackAbortHandler(30 * 1000)

        try {
            const response = await fetch(
                url,
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(postBody),
                    signal: abortHandler.getSignal()
                }
            )

            if (!response.ok) {
                await this.reportError(response)
                return
            }

            const body = await response.json();
            this.setRefreshToken(body.refresh_token);
            this.session_id = body.session_id;

        } catch(e:any) {
            this.reportErrorString(
                'Error while establishing response',
                e.toString()
            );
            throw e
        } finally {
            abortHandler.reset()
        }

    }



    this.retrieveAccessToken = async function(): Promise<void> {
        
        console.log(`Retrieving access token for session ${this.session_id}`);

        if(!this.session_id) {
            this.reportErrorString("Error retrieving access token", "Session has not yet been established")
            return
        }

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + getRefreshToken());

        const abortHandler = new IOStackAbortHandler(30 * 1000)

        try {
            const response = await fetch(
                this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`,
                {
                    method: 'POST',
                    headers: headers,
                    body: "{}",
                    signal: abortHandler.getSignal()
                }
            )

            if (!response.ok) {
                await reportError(response)
                return
            }

            const body = await response.json();

            setAccessToken(body.access_token)
            calcAndSaveAccessTokenRefreshTime(body.access_token);
    
        } catch(e:any) {
            this.reportErrorString(
                'Error while retrieving access token',
                e.toString()
            );
            throw e
        } finally {
            abortHandler.reset()
        }

    }

    this.refreshAccessToken = async function(): Promise<void> {

        console.log(`Refreshing access token for session ${this.session_id}`);

        if(!this.session_id) {
            this.reportErrorString("Error refreshing access token", "Session has not yet been established")
            return
        }


        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + getRefreshToken());

        const abortHandler = new IOStackAbortHandler(30 * 1000)

        try {
            const response = await fetch(
                this.platform_root + `/v1/use_case/session/${this.session_id}/access_token`,
                {
                    method: 'POST',
                    headers: headers,
                    body: "{}",
                    signal:abortHandler.getSignal()
                }
            )

            if (!response.ok) {
                await reportError(response)
                return
            }

            const body = await response.json();

            setAccessToken(body.access_token)
            calcAndSaveAccessTokenRefreshTime(body.access_token);

        } catch(e:any) {
            this.reportErrorString(
                'Error while refreshing access token',
                e.toString()
            );
            throw e
        } finally {
            abortHandler.reset()
        }


    }

    this.refreshRefreshToken = async function(): Promise<void> {

        console.log(`Refreshing refresh token for session ${this.session_id}`);

        if(!this.session_id) {
            this.reportErrorString("Error refreshing refresh token", "Session has not yet been established")
            return
        }

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + getAccessKey());

        const postBody = {
            use_case_id: getAccessKey(),
            client_data: this.use_case_data,
        };

        const url = this.platform_root + `/v1/use_case/session/${this.session_id}/refresh_token`

        const abortHandler = new IOStackAbortHandler(30 * 1000)

        try {
            const response = await fetch(
                url,
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(postBody),
                    signal: abortHandler.getSignal()
                }
            )

            if (!response.ok) {
                await this.reportError(response)
                return
            }

            const body = await response.json();
            this.setRefreshToken(body.refresh_token);

        } catch(e:any) {
            this.reportErrorString(
                'Error while refreshing session refresh token',
                e.toString()
            );
            throw e
        } finally {
            abortHandler.reset()
        }


    }

    this.retrieveUseCaseMetaData = async function(): Promise<void> {

        console.log('Fetching use case metadata');

        const headers = await this.getHeaders();

        const abortHandler = new IOStackAbortHandler(30 * 1000)

        let url = this.platform_root + '/v1/use_case/meta'
        if(this.metadata_list.length > 0)
            url = `${url}?details=${this.metadata_list.join("&details=")}`

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                signal:abortHandler.getSignal()
            })

            if (!response.ok) {
                await reportError(response)
                return
            }

            const body = await response.json();

            this.metadata = body.use_case

        } catch(e:any) {
            this.reportErrorString(
                'Error while retrieving use case metadata',
                e.toString()
            );
            throw e
        } finally {
            abortHandler.reset()
        }

    }

    const calcAndSaveAccessTokenRefreshTime = function(access_token: string): void {
        const decoded = jwtDecode(access_token);
        if (!decoded.exp) {
            throw new Error("Access Token JWT missing exp claim")
        }
        const expiryTime = new Date(decoded.exp * 1000);
        const now = Date.now();
        const refresh_access_token_period = Math.floor(
            (expiryTime.getTime() - now) * 0.7
        );
        const refreshTime = new Date(now + refresh_access_token_period);
        setAccessTokenRefreshTime(refreshTime);
    }

    const calcAndSaveRefreshTokenRefreshTime = function(refresh_token: string): void {
        const decoded = jwtDecode(refresh_token);
        if (!decoded.exp) {
            throw new Error("Refresh Token JWT missing exp claim")
        }
        const expiryTime = new Date(decoded.exp * 1000);
        const now = Date.now();
        const refresh_refresh_token_period = Math.floor(
            (expiryTime.getTime() - now) * 0.7
        );
        const refreshTime = new Date(now + refresh_refresh_token_period);
        setRefreshTokenRefreshTime(refreshTime);
    }

    this.handleStreamedFragment = async function(fragment: StreamFragmentPacket): Promise<void> {
        this.streamFragmentHandlers.forEach(async h => {
            await h(fragment)
        })
    }

    this.handleLLMStats = async function(stats: LLMStatsPacket): Promise<void> {
        this.llmStatsHandlers.forEach(async h => {
            await h(stats)
        })
    }

    this.handleError = async function(error: string): Promise<void> {
        this.errorHandlers.forEach(async h => {
            await h(error)
        })
    }

    this.handleExternalUseCaseNotification = async function(notification: UseCaseNotificationPacket): Promise<void> {
        this.useCaseNotificationHandlers.forEach(async h => {
            await h(notification)
        })
    }

    this.handleUseCaseStreamedReferenceNotification = async function(notification: StreamedReferenceNotificationPacket): Promise<void> {
        this.useCaseStreamedReferenceNotificationHandlers.forEach(async h => {
            await h(notification)
        })
    }

    this.handleActiveNodeChange = async function(notification: UseCaseActiveNodeChangeNotification): Promise<void> {
        this.useCaseActiveNodeChangeNotificationHandlers.forEach(async h => {
            await h(notification)
        })
    }

    this.reportError = async function(response: Response): Promise<void> {
        const error = await response.json();
        const errorText = `${response.statusText}:${error.message || error.detail}`;
        await this.handleError(errorText)
        // throw new Error(errorText);
    }

    this.reportErrorString = async function(error: string, message: string): Promise<void> {
        await this.handleError(`${error} - ${message}`)
        // throw new Error(`${error} - ${message}`);
    }

}

IOStackClientConstructor.prototype.startSession = async function() {

    try {
        await this.establishSession();
        await this.retrieveAccessToken();
        if(this.metadata_list.length > 0) {
            await this.retrieveUseCaseMetaData();
        }
        await this.sendMessageAndStreamResponse(this.metadata?.trigger_phrase||"-")   // Send blank input to trigger first response
    } finally {
        // All errors and exceptions should have been reported via the callback
    }
}

IOStackClientConstructor.prototype.sendMessageAndStreamResponse = async function(message: string): Promise<void> {

    if(!message) {
        return
    }

    if(!this.session_id) {
        this.reportErrorString("Error sending message", "Session has not yet been established")
        return
    }

    const headers = await this.getHeaders();

    const postBody = {
        message: message,
        ...this.stream_post_data_addenda
    };

    const abortHandler = new IOStackAbortHandler(60 * 1000)

    try {

        const response: Response = await fetch(this.platform_root + `/v1/use_case/session/${this.session_id}/stream`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(postBody),
            signal:abortHandler.getSignal()
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
        abortHandler.reset()
    }
}


