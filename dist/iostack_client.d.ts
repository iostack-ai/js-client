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
export interface SessionStateUpdateNotificationPacket extends UseCaseNotificationPacket {
    data: Record<string, any>;
}
export interface UseCaseActiveNodeChangePayload {
    active_node: string;
    active_node_code: string;
    assembly?: Record<string, any> | undefined;
}
export interface UseCaseActiveNodeChangeNotification extends ClientNotificationPacket {
    data: UseCaseActiveNodeChangePayload;
}
export interface StreamingErrorPacket extends ClientNotificationPacket {
    error: string;
    message: string;
}
type StreamFragmentHandler = (fragment: StreamFragmentPacket) => Promise<void>;
type LLMStatsHandler = (stats: LLMStatsPacket) => Promise<void>;
type ErrorHandler = (error: string) => Promise<void>;
type UseCaseNoficationHandler = (notification: UseCaseNotificationPacket) => Promise<void>;
type UseCaseActiveNodeChangeNoficationHandler = (notification: UseCaseActiveNodeChangeNotification) => Promise<void>;
export declare class IOStackClient {
    protected platform_root: string;
    private use_case;
    private use_case_data;
    private session_id;
    private metadata;
    private decoder;
    private allow_browser_to_manage_tokens;
    private streamFragmentHandlers;
    private llmStatsHandlers;
    private errorHandlers;
    private useCaseNotificationHandlers;
    private useCaseActiveNodeChangeNotificationHandlers;
    private setRefreshToken;
    private getRefreshToken;
    private setAccessToken;
    private getAccessToken;
    private getAccessKey;
    private setAccessTokenRefreshTime;
    protected accessTokenExpired: () => boolean;
    constructor({ access_key, use_case_data, allow_browser_to_manage_tokens, use_case, platform_root, }: {
        access_key: string | null;
        use_case_data: Record<string, any>;
        allow_browser_to_manage_tokens: boolean;
        use_case?: string | undefined;
        platform_root?: string | undefined;
    });
    deregisterAllHandlers(): void;
    registerStreamFragmentHandler(h: StreamFragmentHandler): void;
    registerLLMStatsHandler(h: LLMStatsHandler): void;
    registerErrorHandler(h: ErrorHandler): void;
    registerUseCaseNotificationHandler(h: UseCaseNoficationHandler): void;
    registerUseCaseActiveNodeChangeNotificationHandler(h: UseCaseActiveNodeChangeNoficationHandler): void;
    getTriggerPrompt(): string;
    startSession(): Promise<void>;
    protected getHeaders(): Headers;
    sendMessageAndStreamResponse(message: string): Promise<void>;
    private processMessage;
    private handleStreamingResponse;
    private handleUseCaseNotification;
    private establishSession;
    private retrieveAccessToken;
    protected refreshAccessToken(): Promise<void>;
    private retrieveUseCaseMetaData;
    private calcAndSaveAccessTokenRefreshTime;
    private handleStreamedFragment;
    private handleLLMStats;
    private handleError;
    private handleExternalUseCaseNotification;
    private handleActiveNodeChange;
    protected reportError(response: Response): Promise<void>;
    protected reportErrorString(error: string, message: string): Promise<void>;
}
export {};
