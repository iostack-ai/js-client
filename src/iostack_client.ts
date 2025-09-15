/* eslint-disable no-console */
import { jwtDecode } from 'jwt-decode';

import { IOStackAbortHandler } from './aborthandler';
import { 
  ClientNotificationPacket,
  StreamedReferenceNotificationPacket, 
  StreamFragmentPacket, 
  StreamingErrorPacket, 
  UseCaseActiveNodeChangeNotification, 
  UseCaseNotificationPacket 
} from './notifications';

export type StreamFragmentHandler = (fragment: StreamFragmentPacket) => Promise<void>;
export type ErrorHandler = (error: string) => Promise<void>;

export type UseCaseNoficationHandler = (notification: UseCaseNotificationPacket) => Promise<void>;
export type ActiveNodeChangeNotificationHandler = (notification: UseCaseActiveNodeChangeNotification) => Promise<void>;
export type ReferenceNotificationHandler = (notification: StreamedReferenceNotificationPacket) => Promise<void>;

interface Closure {
  refresh_token: string | null;
  access_token: string | null;
  access_key: string;
  access_token_refresh_time: Date | null;
  refresh_token_refresh_time: Date | null;
}

export interface ClientConstructorArgs {
  access_key: string;
  use_case_data?: Record<string, any> | undefined;
  user_id?: string | undefined;
  platform_root?: string | undefined;
  response_timeout?: number | undefined;
}

export class IOStackClient {

  // Hold all sensitive data here
  #closure: Closure;
  
  private platform_root: string;
  private session_id: string | null;

  private use_case_data: Record<string, any>;
  private user_id: string | null;

  // Notification packet handlers
  private streamFragmentHandlers: StreamFragmentHandler[];
  private errorHandlers: ErrorHandler[];
  private useCaseNotificationHandlers: UseCaseNoficationHandler[];
  private useCaseActiveNodeChangeNotificationHandlers: ActiveNodeChangeNotificationHandler[];
  private useCaseStreamedReferenceNotificationHandlers: ReferenceNotificationHandler[];

  private decoder: TextDecoder;
  private metadata: Record<string, any>;
  private runningBuffer: string = "";

  private response_timeout: number;

  public constructor({
    access_key,
    use_case_data,
    user_id,
    platform_root,
    response_timeout,
  }: ClientConstructorArgs) {

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
    this.response_timeout = response_timeout || 30

    // Set up #private data for sensitive details
    this.#closure = {
      refresh_token: '',
      access_token: '',
      access_key,
      access_token_refresh_time: new Date(0),
      refresh_token_refresh_time: new Date(0),
    };

  }

  public getSessionId(): string | null {
    return this.session_id;
  }

  public deregisterAllHandlers(): void {
    this.streamFragmentHandlers = [];
    this.errorHandlers = [];
    this.useCaseNotificationHandlers = [];
    this.useCaseActiveNodeChangeNotificationHandlers = [];
    this.useCaseStreamedReferenceNotificationHandlers = [];
  }

  public async startSession(sessionId: string | undefined = undefined) {
    await this.restartSession(sessionId)
    await this.sendMessage(this.metadata.trigger_phrase || '-'); // Send blank input to trigger first response
  }

  public async restartSession(sessionId: string | undefined = undefined) {
    this.session_id = null;
    this.metadata = {};
    if (sessionId) {
      this.session_id = sessionId;
      await this.retrieveAccessToken();
      await this.retrieveUseCaseMetaData();
    } else {
      await this.establishSession();
    }
  }

  public async sendMessage(message: string): Promise<void> {

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

    const url = `${this.platform_root}/v2/use_case/session/${this.session_id}/stream`

    try {
      const response: Response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(postBody),
        signal: abortHandler.getSignal(),
      });

      if (!response.ok || !response.body) {
        const error = await this.reportError(response);
        throw new Error(error);
      }

      const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader();

      const lambda = async (message: ReadableStreamReadResult<Uint8Array>): Promise<void> => {

        const streamedResponsesString = this.decoder.decode(message.value, { stream: true });

        try {
          await this.processSSEMessage(streamedResponsesString);
        }
        catch (e: any) {
          this.reportErrorString('Error while decoding streaming response', e.toString())
          throw e
        }

        if (message.done) {
          return;
        }

        await reader.read().then(lambda);

      };

      return await reader.read().then(lambda);

    } catch (e: any) {
      this.reportErrorString('Error while streaming response', e.toString());
      throw e;
    } finally {
      abortHandler.reset();
    }
  }

  public getTriggerPrompt(): string {
    if (!this.metadata.trigger_phrase) {
      this.reportErrorString("Can't retrieve trigger prompt", 'Metadata not retrieved');
      return '';
    }
    return this.metadata.trigger_phrase;
  }

  private async getHeaders(): Promise<Headers> {
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

  private async processSSEMessage(streamedResponsesString: string): Promise<void> {

    this.runningBuffer += streamedResponsesString

    let parts = this.runningBuffer.split("\n\n");
    this.runningBuffer = parts.pop() || "";  // incomplete

    for (const part of parts) {
      if (part.startsWith("data:")) {
        const remainder = part.replace(/^data:\s*/, "")
        // console.log(`Processing ${remainder}`)
        await this.handleStreamingResponse((remainder));
      }
    }

  }

  private async handleStreamingResponse(streamedResponseString: string): Promise<void> {
    if (!streamedResponseString) return;

    const streamedResponse: ClientNotificationPacket = JSON.parse(streamedResponseString);

    switch (streamedResponse.type) {
      case 'fragment':
        await this.onStreamedFragment(streamedResponse as StreamFragmentPacket);
        break;

      case 'error':{
        if((streamedResponse as StreamingErrorPacket).message) {
          await this.onError((streamedResponse as StreamingErrorPacket).message);
          throw new Error((streamedResponse as StreamingErrorPacket).message);
        } else {
          await this.onError((streamedResponse as StreamingErrorPacket).error);
          throw new Error((streamedResponse as StreamingErrorPacket).error);
        }
      }      

      case 'use_case_notification':
        await this.handleUseCaseNotification(streamedResponse as UseCaseNotificationPacket);
        break;

      case 'streamed_ref':
        await this.onStreamedReference(streamedResponse as StreamedReferenceNotificationPacket);
        break;

      default:
        break;
    }
  }

  private async handleUseCaseNotification(result: UseCaseNotificationPacket): Promise<void> {
    switch (result.name) {
      case 'graph_active_node_change':
        await this.onActiveNodeChange(result as unknown as UseCaseActiveNodeChangeNotification);
        break;

      default:
        await this.onUseCaseNotification(result);
    }
  }

  private async establishSession(): Promise<void> {
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
        }
      }

      this.session_id = body.session_id;
    } catch (e: any) {
      this.reportErrorString('Error while establishing response', e.toString());
      throw e;
    } finally {
      abortHandler.reset();
    }
  }

  private async retrieveAccessToken(): Promise<void> {

    if (!this.session_id) {
      this.reportErrorString('Error retrieving access token', 'Session has not yet been established');
      return;
    }

    if (this.accessTokenRetrieved() || !this.accessTokenExpired()) {
      return
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
    } catch (e: any) {
      this.reportErrorString('Error while retrieving access token', e.toString());
      throw e;
    } finally {
      abortHandler.reset();
    }
  }

  private async refreshAccessToken(): Promise<void> {
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
    } catch (e: any) {
      this.reportErrorString('Error while refreshing access token', e.toString());
      throw e;
    } finally {
      abortHandler.reset();
    }
  }

  private async refreshRefreshToken(): Promise<void> {

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
    } catch (e: any) {
      this.reportErrorString('Error while refreshing session refresh token', e.toString());
      throw e;
    } finally {
      abortHandler.reset();
    }
  }

  private async retrieveUseCaseMetaData(): Promise<void> {

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
    } catch (e: any) {
      this.reportErrorString('Error while retrieving use case metadata', e.toString());
      throw e;
    } finally {
      abortHandler.reset();
    }
  }

  private calcAndSaveAccessTokenRefreshTime(access_token: string): void {
    const decoded = jwtDecode(access_token);
    if (!decoded.exp) {
      throw new Error('Access Token JWT missing exp claim');
    }
    const expiryTime = new Date(decoded.exp * 1000);
    const now = Date.now();
    const refresh_access_token_period = Math.floor((expiryTime.getTime() - now) * 0.7);
    const refreshTime = new Date(now + refresh_access_token_period);
    this.setAccessTokenRefreshTime(refreshTime);
  }

  private calcAndSaveRefreshTokenRefreshTime(refresh_token: string): void {
    const decoded = jwtDecode(refresh_token);
    if (!decoded.exp) {
      throw new Error('Refresh Token JWT missing exp claim');
    }
    const expiryTime = new Date(decoded.exp * 1000);
    const now = Date.now();
    const refresh_refresh_token_period = Math.floor((expiryTime.getTime() - now) * 0.7);
    const refreshTime = new Date(now + refresh_refresh_token_period);
    this.setRefreshTokenRefreshTime(refreshTime);
  }

  public addStreamFragmentHandler(i: StreamFragmentHandler): void {
    this.streamFragmentHandlers.push(i)
  }

  private async onStreamedFragment(fragment: StreamFragmentPacket): Promise<void> {
    this.streamFragmentHandlers.forEach(async (h) => {
      await h(fragment);
    });
  }

  public addErrorHandler(i: ErrorHandler): void {
    this.errorHandlers.push(i)
  }

  private async onError(error: string): Promise<void> {
    this.errorHandlers.forEach(async (h) => {
      await h(error);
    });
  }

  public addUseCaseNotificationHandler(i: UseCaseNoficationHandler): void {
    this.useCaseNotificationHandlers.push(i)
  }

  private async onUseCaseNotification(notification: UseCaseNotificationPacket): Promise<void> {
    this.useCaseNotificationHandlers.forEach(async (h) => {
      await h(notification);
    });
  }

  public addStreamedReferenceHandler(i: ReferenceNotificationHandler): void {
    this.useCaseStreamedReferenceNotificationHandlers.push(i)
  }

  private async onStreamedReference(notification: StreamedReferenceNotificationPacket): Promise<void> {
    this.useCaseStreamedReferenceNotificationHandlers.forEach(async (h) => {
      await h(notification);
    });
  }

  public addActiveNodeChangeHandler(i: ActiveNodeChangeNotificationHandler): void {
    this.useCaseActiveNodeChangeNotificationHandlers.push(i)
  }

  private async onActiveNodeChange(notification: UseCaseActiveNodeChangeNotification): Promise<void> {
    this.useCaseActiveNodeChangeNotificationHandlers.forEach(async (h) => {
      await h(notification);
    });
  }

  private async reportError(response: Response): Promise<string> {
    const error = await response.json();
    const errorText = `${response.statusText}:${error.message || error.detail}`;
    await this.onError(errorText);
    return errorText;
  }

  private async reportErrorString(error: string, message: string): Promise<void> {
    await this.onError(`${error} - ${message}`);
    // throw new Error(`${error} - ${message}`);
  }

  private setRefreshToken(i: string | null) {
    this.#closure.refresh_token = i;
  }

  private getRefreshToken() {
    return this.#closure.refresh_token;
  }

  private setAccessToken(i: string | null) {
    this.#closure.access_token = i;
  }

  private getAccessToken() {
    return this.#closure.access_token;
  }

  private getAccessKey() {
    return this.#closure.access_key;
  }

  private setAccessTokenRefreshTime(i: Date) {
    this.#closure.access_token_refresh_time = i;
  }

  private accessTokenRetrieved(): boolean {
    return !!this.#closure.access_token_refresh_time;
  }

  private accessTokenExpired(): boolean {
    return !!this.#closure.access_token_refresh_time && new Date(Date.now()) >= this.#closure.access_token_refresh_time;
  }

  private setRefreshTokenRefreshTime(i: Date) {
    this.#closure.refresh_token_refresh_time = i;
  }

  private refreshTokenExpired(): boolean {
    return (
      !!this.#closure.refresh_token_refresh_time && new Date(Date.now()) >= this.#closure.refresh_token_refresh_time
    );
  }

  private updateRefreshToken(i: string): void {
    this.setRefreshToken(i);
    this.calcAndSaveRefreshTokenRefreshTime(i);
  }
}



