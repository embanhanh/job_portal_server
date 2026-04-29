/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-member-access */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NOTIFICATION_QUEUE } from './notification.service';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing notification job: ${job.id}`);

    switch (job.name) {
      case 'send-push':
        await this.handlePushNotification(job.data);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handlePushNotification(data: any) {
    this.logger.log(
      `Sending push notification to user ${data.userId}: ${data.title}`,
    );
    // TODO: Integrate Firebase Admin SDK here.
    // Example: admin.messaging().sendToDevice(deviceToken, payload)
  }
}
