import { registerAs } from '@nestjs/config';

export const elasticsearchConfig = registerAs('elasticsearch', () => ({
  node: process.env.ELASTICSEARCH_NODE ?? 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME ?? 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD ?? 'changeme',
  },
}));
