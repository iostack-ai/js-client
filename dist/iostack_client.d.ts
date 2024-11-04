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
type UseCaseActiveNodeChangeNotificationHandler = (notification: UseCaseActiveNodeChangeNotification) => Promise<void>;
type StreamedReferenceNotificationHandler = (notification: StreamedReferenceNotificationPacket) => Promise<void>;
export declare class IOStackClient {
    protected platform_root: string;
    private use_case_data;
    private session_id;
    private metadata;
    private decoder;
    private allow_browser_to_manage_tokens;
    protected stream_post_data_addenda: Record<string, any>;
    private metadata_list;
    private streamFragmentHandlers;
    private llmStatsHandlers;
    private errorHandlers;
    private useCaseNotificationHandlers;
    private useCaseActiveNodeChangeNotificationHandlers;
    private useCaseStreamedReferenceNotificationHandlers;
    private setRefreshToken;
    private getRefreshToken;
    private setAccessToken;
    private getAccessToken;
    private getAccessKey;
    private setAccessTokenRefreshTime;
    protected accessTokenExpired: () => boolean;
    constructor({ access_key, allow_browser_to_manage_tokens, use_case_data, platform_root, metadata_list }: {
        access_key: string;
        allow_browser_to_manage_tokens: boolean;
        use_case_data?: Record<string, any> | undefined;
        platform_root?: string | undefined;
        metadata_list?: string[] | undefined;
    });
    deregisterAllHandlers(): void;
    registerStreamFragmentHandler(h: StreamFragmentHandler): void;
    registerLLMStatsHandler(h: LLMStatsHandler): void;
    registerErrorHandler(h: ErrorHandler): void;
    registerUseCaseNotificationHandler(h: UseCaseNoficationHandler): void;
    registerUseCaseStreamReferenceNotificationHandler(h: StreamedReferenceNotificationHandler): void;
    registerUseCaseActiveNodeChangeNotificationHandler(h: UseCaseActiveNodeChangeNotificationHandler): void;
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
    private handleUseCaseStreamedReferenceNotification;
    private handleActiveNodeChange;
    protected reportError(response: Response): Promise<void>;
    protected reportErrorString(error: string, message: string): Promise<void>;
}
export {};
