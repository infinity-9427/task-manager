export enum TaskStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum MessageType {
  GENERAL = 'GENERAL',
  DIRECT = 'DIRECT'
}

export enum SocketEvents {
  MESSAGE_SENT = 'message:sent',
  MESSAGE_RECEIVED = 'message:received',
  USER_TYPING = 'user:typing',
  USER_STOP_TYPING = 'user:stop_typing',
  JOIN_ROOM = 'join',
  LEAVE_ROOM = 'leave',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline'
}