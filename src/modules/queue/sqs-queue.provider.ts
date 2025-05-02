import {
  CreateQueueCommand,
  ListQueuesCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Consumer } from 'sqs-consumer';
import { EnvService } from '../env/env.service';
import { HealthIndicatorSession } from '@nestjs/terminus/dist/health-indicator/health-indicator.service';
import { HealthIndicatorService } from '@nestjs/terminus';
import { QueueProvider } from '@modules/queue/queue-provider';

@Injectable()
export class SqsQueueProvider implements OnModuleDestroy, QueueProvider {
  private consumers = new Map<string, Consumer>();
  private logger = new Logger(SqsQueueProvider.name);
  private indicator: HealthIndicatorSession;

  private readonly sqs: SQSClient;

  constructor(
    private readonly env: EnvService,
    private readonly healthIndicator: HealthIndicatorService,
  ) {
    this.indicator = this.healthIndicator.check('queue_provider');

    this.sqs = new SQSClient({
      region: this.env.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.env.get('AWS_SECRET_KEY_ACCESS'),
      },
    });
  }

  async publish<Payload = any>(name: string, payload: Payload): Promise<void> {
    const endpoint = await this.createQueueIfNotExists(name);

    await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: endpoint,
        MessageBody: JSON.stringify(payload),
      }),
    );
  }

  async subscribe<Payload = any>(
    name: string,
    callback: (payload: Payload) => Promise<void> | void,
  ): Promise<void> {
    try {
      const endpoint = await this.createQueueIfNotExists(name);

      let consumer: Consumer = this.consumers.get(endpoint);

      if (!consumer) {
        consumer = Consumer.create({
          queueUrl: endpoint,
          sqs: this.sqs,
          handleMessage: async (message) => {
            const payload = JSON.parse(message.Body);
            await callback(payload);
          },
        });

        this.consumers.set(endpoint, consumer);
      }

      if (!consumer.status.isRunning) {
        consumer.start();
        consumer.on('error', (err) => this.logger.error(err));
        consumer.on('processing_error', (err) => this.logger.error(err));
        consumer.on('message_received', (message) =>
          this.logger.log(`Message received: ${JSON.stringify(message.Body)}`),
        );
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async createQueueIfNotExists(name: string): Promise<string> {
    let queueUrl: string;

    const currentQueues = await this.sqs.send(
      new ListQueuesCommand({ QueueNamePrefix: name }),
    );

    if (!currentQueues?.QueueUrls?.length) {
      const results = await this.sqs.send(
        new CreateQueueCommand({ QueueName: name }),
      );

      queueUrl = results.QueueUrl;
    } else {
      queueUrl = currentQueues.QueueUrls[0];
    }

    return queueUrl;
  }

  async onModuleDestroy() {
    this.consumers.forEach((consumer) => {
      consumer.removeAllListeners();
      consumer.stop();
    });
  }

  async healthCheck() {
    const checkList: { name: string; active: boolean }[] = [];

    for (const [key, consumer] of this.consumers.entries()) {
      checkList.push({
        name: key,
        active: consumer.status.isRunning,
      });

      this.logger.debug(
        `Health check for ${key}: ${consumer.status.isRunning}`,
      );
    }

    const isHeath = checkList.every((check) => check.active);

    return isHeath ? this.indicator.up() : this.indicator.down();
  }
}
