export declare class IOStackAbortHandler {
    private controller;
    private signal;
    private timeoutId;
    constructor(timeoutInMillis: number);
    getSignal(): AbortSignal;
    reset(): void;
}
