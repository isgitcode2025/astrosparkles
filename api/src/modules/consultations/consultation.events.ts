import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

export type ConsultationEventName = 'consultation.updated' | 'message.created' | 'consultation.warning' | 'user.signedOut';

/**
 * Small in-process event bus so the service does not depend on the socket gateway.
 * When we run several API servers this becomes Redis pub/sub (Socket.IO Redis adapter).
 */
@Injectable()
export class ConsultationEvents extends EventEmitter {
  emitEvent(name: ConsultationEventName, payload: unknown) {
    this.emit(name, payload);
  }
}
