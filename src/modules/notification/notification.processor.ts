import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NOTIFICATION_QUEUE } from './notification.service';

export interface PushNotificationData {
  userId: string;
  title: string;
  body?: string;
  data?: Record<string, string>;
}

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<unknown, void, string>): Promise<void> {
    this.logger.debug(`Processing notification job: ${job.id}`);

    switch (job.name) {
      case 'send-push':
        await this.handlePushNotification(job.data as PushNotificationData);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handlePushNotification(data: PushNotificationData) {
    this.logger.log(
      `Sending push notification to user ${data.userId}: ${data.title}`,
    );
    // TODO: Integrate Firebase Admin SDK here.
    // Example: admin.messaging().sendToDevice(deviceToken, payload)
  }
}
