import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BaseService } from '../../common/base/base.service';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './notification.repository';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationType } from './enums/notification-type.enum';

export const NOTIFICATION_QUEUE = 'notification-queue';

@Injectable()
export class NotificationService extends BaseService<Notification> {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {
    super(notificationRepository);
  }

  async getUserNotifications(userId: string, pagination: PaginationDto) {
    return this.notificationRepository.findByUserId(userId, pagination);
  }

  async markAsRead(id: string, userId: string) {
    await this.notificationRepository.markAsRead(id, userId);
    return { success: true };
  }

  async sendNotification(
    userId: string,
    title: string,
    content: string,
    type: NotificationType,
    metadata?: Record<string, unknown>,
  ) {
    // Save to database
    const notification = await this.create({
      userId,
      title,
      content,
      type,
      metadata,
    });

    // Add push notification to queue
    await this.notificationQueue.add('send-push', {
      userId,
      title,
      content,
      data: metadata,
    });

    return notification;
  }
}
