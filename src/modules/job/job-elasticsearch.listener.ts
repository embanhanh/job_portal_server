import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Client } from '@elastic/elasticsearch';
import type {
  MappingTypeMapping,
  SearchHit,
} from '@elastic/elasticsearch/lib/api/types';
import { ConfigService } from '@nestjs/config';
import { Job } from './entities/job.entity';
import { JOB_EVENTS } from './job.service';
import type {
  JobSearchDocument,
  JobSearchResult,
  JobSearchResponse,
} from './interfaces/job-search.interface';

const JOB_INDEX = 'jobs';

@Injectable()
export class JobElasticsearchListener implements OnModuleInit {
  private readonly logger = new Logger(JobElasticsearchListener.name);
  private client!: Client;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.client = new Client({
        node: this.configService.get<string>('elasticsearch.node'),
        auth: {
          username:
            this.configService.get<string>('elasticsearch.auth.username') ?? '',
          password:
            this.configService.get<string>('elasticsearch.auth.password') ?? '',
        },
      });

      await this.ensureIndex();
      this.logger.log('Elasticsearch client connected');
    } catch (error) {
      this.logger.warn(
        'Elasticsearch connection failed. Search limited to DB.',
        (error as Error).message,
      );
    }
  }

  @OnEvent(JOB_EVENTS.CREATED)
  async onJobCreated(job: Job): Promise<void> {
    await this.indexJob(job);
  }

  @OnEvent(JOB_EVENTS.UPDATED)
  @OnEvent(JOB_EVENTS.PUBLISHED)
  async onJobUpdated(job: Job): Promise<void> {
    await this.indexJob(job);
  }

  @OnEvent(JOB_EVENTS.DELETED)
  async onJobDeleted(job: Job): Promise<void> {
    try {
      await this.client.delete({ index: JOB_INDEX, id: job.id });
      this.logger.log(`Job removed from ES: ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete from ES: ${job.id}`, error);
    }
  }

  async searchJobs(
    query: string,
    from = 0,
    size = 10,
  ): Promise<JobSearchResponse> {
    try {
      const result = await this.client.search<JobSearchDocument>({
        index: JOB_INDEX,
        from,
        size,
        query: {
          multi_match: {
            query,
            fields: [
              'title.vi^3',
              'title.en^3',
              'description.vi',
              'description.en',
              'skills^2',
              'companyName',
              'locationName',
            ],
            fuzziness: 'AUTO',
          },
        },
      });

      const total =
        typeof result.hits.total === 'number'
          ? result.hits.total
          : (result.hits.total?.value ?? 0);

      const hits: JobSearchResult[] = result.hits.hits.map(
        (hit: SearchHit<JobSearchDocument>) => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
        }),
      );

      return { hits, total };
    } catch (error) {
      this.logger.error('Elasticsearch search failed', error);
      return { hits: [], total: 0 };
    }
  }

  // ── Private ────────────────────────────────────────────────────────

  private async indexJob(job: Job): Promise<void> {
    try {
      // Extract skill names from jobSkills relation
      const skillNames =
        job.jobSkills
          ?.map((js) => {
            const skillName = js.skill?.name;
            if (skillName && typeof skillName === 'object') {
              return (
                (skillName as Record<string, string>).en ??
                (skillName as Record<string, string>).vi ??
                ''
              );
            }
            return '';
          })
          .filter(Boolean) ?? [];

      await this.client.index<JobSearchDocument>({
        index: JOB_INDEX,
        id: job.id,
        document: {
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          companyName: job.company?.companyName,
          locationName: undefined,
          type: job.type,
          status: job.status,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          skills: skillNames,
          categoryId: job.categoryId,
          locationId: job.locationId,
          companyId: job.companyId,
          employerId: job.employerId,
          createdAt: job.createdAt,
          expiredAt: job.expiredAt,
        },
      });
      this.logger.log(`Job indexed in ES: ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to index job: ${job.id}`, error);
    }
  }

  private async ensureIndex(): Promise<void> {
    const exists = await this.client.indices.exists({ index: JOB_INDEX });
    if (!exists) {
      const mappings: MappingTypeMapping = {
        properties: {
          title: { type: 'object', enabled: true },
          description: { type: 'object', enabled: true },
          companyName: { type: 'text', analyzer: 'standard' },
          locationName: { type: 'text' },
          type: { type: 'keyword' },
          status: { type: 'keyword' },
          salaryMin: { type: 'float' },
          salaryMax: { type: 'float' },
          skills: { type: 'keyword' },
          categoryId: { type: 'keyword' },
          locationId: { type: 'keyword' },
          companyId: { type: 'keyword' },
          createdAt: { type: 'date' },
          expiredAt: { type: 'date' },
        },
      };

      await this.client.indices.create({ index: JOB_INDEX, mappings });
      this.logger.log(`ES index "${JOB_INDEX}" created`);
    }
  }
}
