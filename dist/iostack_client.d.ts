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
export declare class IOStackAbortHandler {
    private controller;
    private signal;
    private timeoutId;
    constructor(timeoutInMillis: number);
    getSignal(): AbortSignal;
    reset(): void;
}
export interface IOStackClient {
    platform_root: string;
    stream_post_data_addenda: {};
    use_case_data: {};
    session_id: string | null;
    streamFragmentHandlers: StreamFragmentHandler[];
    llmStatsHandlers: LLMStatsHandler[];
    errorHandlers: ErrorHandler[];
    useCaseNotificationHandlers: UseCaseNoficationHandler[];
    useCaseActiveNodeChangeNotificationHandlers: UseCaseActiveNodeChangeNotificationHandler[];
    useCaseStreamedReferenceNotificationHandlers: StreamedReferenceNotificationHandler[];
    metadata_list: string[];
    decoder: TextDecoder;
    metadata: Record<string, any> | null;
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
    setRefreshToken(i: string): void;
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
    retrieveUseCaseMetaData(): Promise<void>;
    reportErrorString(error: string, message: string): Promise<void>;
}
export type ClientConstructorArgs = {
    access_key: string;
    use_case_data?: Record<string, any> | undefined;
    platform_root?: string | undefined;
    metadata_list?: string[] | undefined;
};
export declare function newIOStackClient(args: ClientConstructorArgs): IOStackClient;
export declare function IOStackClientConstructor(this: IOStackClient, args: ClientConstructorArgs): void;
export {};
