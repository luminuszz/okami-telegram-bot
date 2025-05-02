export abstract class QueueProvider {
  abstract publish<Payload = any>(
    name: string,
    payload: Payload,
  ): Promise<void> | void;
  abstract subscribe<Payload = any>(
    name: string,
    callback: (payload: Payload) => Promise<void> | void,
  ): Promise<void> | void;

  abstract healthCheck(): Promise<any> | any;
}
