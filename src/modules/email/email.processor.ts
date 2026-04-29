import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EMAIL_QUEUE, SendEmailDto } from './email.service';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<SendEmailDto>): Promise<void> {
    this.logger.debug(`Processing email job: ${job.id}`);

    const { to, subject, template } = job.data;

    // Simulate sending email via Resend / SendGrid
    this.logger.log(
      `[Email sent] To: ${to} | Subject: ${subject} | Template: ${template}`,
    );
    // Await for linter
    await Promise.resolve();
  }
}
