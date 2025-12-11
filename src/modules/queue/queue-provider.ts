export abstract class QueueProvider {
	abstract publish<Payload = unknown>(name: string, payload: Payload): Promise<void> | void;
	abstract subscribe<Payload = unknown>(
		name: string,
		callback: (payload: Payload) => Promise<void> | void,
	): Promise<void> | void;

	abstract healthCheck(): Promise<boolean> | boolean;
}
