export interface JobSearchDocument {
  title: Record<string, string>;
  description: Record<string, string>;
  requirements?: Record<string, string>;
  benefits?: Record<string, string>;
  company: string;
  location: string;
  type: string;
  status: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  skills?: string[];
  employerId: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface JobSearchResult {
  id: string | undefined;
  score: number | null | undefined;
  [key: string]: unknown;
}

export interface JobSearchResponse {
  hits: JobSearchResult[];
  total: number;
}
