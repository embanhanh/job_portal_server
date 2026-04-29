import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import {
  NotificationService,
  NOTIFICATION_QUEUE,
} from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationProcessor } from './notification.processor';
import { NotificationListener } from './notification.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationProcessor,
    NotificationListener,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
