import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { JobModule } from '../job/job.module';
import { CompanyModule } from '../company/company.module';
import { AuthModule } from '../auth/auth.module';

import { AdminService } from './admin.service';

@Module({
  imports: [JobModule, CompanyModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
