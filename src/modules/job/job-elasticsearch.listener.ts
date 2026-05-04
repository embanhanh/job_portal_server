import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Client } from '@elastic/elasticsearch';
import type {
  MappingTypeMapping,
  SearchHit,
} from '@elastic/elasticsearch/lib/api/types';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { JobTranslation } from './entities/job-translation.entity';
import { JOB_EVENTS } from './job.constants';
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

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(JobTranslation)
    private readonly jobTranslationRepo: Repository<JobTranslation>,
  ) {}

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
      // Fetch translations
      const translations = await this.jobTranslationRepo.find({
        where: { jobId: job.id },
      });

      const titleObj: Record<string, string> = {};
      const descObj: Record<string, string> = {};
      const reqObj: Record<string, string> = {};
      const benObj: Record<string, string> = {};

      for (const t of translations) {
        if (t.title) titleObj[t.language] = t.title;
        if (t.description) descObj[t.language] = t.description;
        if (t.requirements) reqObj[t.language] = t.requirements;
        if (t.benefits) benObj[t.language] = t.benefits;
      }

      // If no translations exist yet (e.g. during very early dual-write testing),
      // fallback to the JSONB object if it's an object, or just set it as 'vi' if it's a string
      const resolveField = (
        fieldObj: Record<string, string>,
        fallback: unknown,
      ): Record<string, string> => {
        if (Object.keys(fieldObj).length > 0) return fieldObj;
        if (typeof fallback === 'object' && fallback !== null)
          return fallback as Record<string, string>;
        if (typeof fallback === 'string') return { vi: fallback, en: fallback };
        return { vi: '', en: '' };
      };

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
            if (typeof skillName === 'string') return skillName;
            return '';
          })
          .filter(Boolean) ?? [];

      await this.client.index<JobSearchDocument>({
        index: JOB_INDEX,
        id: job.id,
        document: {
          title: resolveField(titleObj, job.title),
          description: resolveField(descObj, job.description),
          requirements: resolveField(reqObj, job.requirements),
          benefits: resolveField(benObj, job.benefits),
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
          title: {
            properties: {
              vi: { type: 'text', analyzer: 'standard' },
              en: { type: 'text', analyzer: 'english' },
            },
          },
          description: {
            properties: {
              vi: { type: 'text', analyzer: 'standard' },
              en: { type: 'text', analyzer: 'english' },
            },
          },
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
