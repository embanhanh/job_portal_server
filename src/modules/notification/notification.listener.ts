import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { NotificationType } from './enums/notification-type.enum';
import { APPLICATION_EVENTS } from '../application/application.service';
import { Application } from '../application/entities/application.entity';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(APPLICATION_EVENTS.STATUS_UPDATED)
  async handleApplicationStatusUpdated(application: Application) {
    this.logger.log(
      `Handling application.status.updated event for application ${application.id}`,
    );

    await this.notificationService.sendNotification(
      application.candidateId, // Wait, Application entity has candidateId?
      'Cập nhật trạng thái ứng tuyển',
      `Hồ sơ ứng tuyển của bạn đã chuyển sang trạng thái: ${application.status}`,
      NotificationType.APPLICATION,
      { applicationId: application.id, status: application.status },
    );
  }
}
