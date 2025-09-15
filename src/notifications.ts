
export interface ClientNotificationPacket {
  type: string;
}

export interface StreamFragmentPacket extends ClientNotificationPacket {
  fragment: string;
  final: boolean;
}

export interface StreamedReferenceNotificationPacket extends ClientNotificationPacket {
  ref: string;
  value: Record<string, any>;
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