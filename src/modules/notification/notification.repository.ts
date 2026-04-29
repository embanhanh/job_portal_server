import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { BaseRepository } from '../../common/base/base.repository';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationRepository extends BaseRepository<Notification> {
  constructor(
    @InjectRepository(Notification)
    repository: Repository<Notification>,
  ) {
    super(repository);
  }

  async findByUserId(userId: string, pagination: PaginationDto) {
    return this.findAllPaginated(pagination, { userId });
  }

  async markAsRead(id: string, userId: string) {
    await this.repository.update({ id, userId }, { isRead: true });
  }
}
