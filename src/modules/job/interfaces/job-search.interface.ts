export interface JobSearchDocument {
  title: Record<string, string>;
  description: Record<string, string>;
  requirements?: Record<string, string>;
  benefits?: Record<string, string>;
  companyName?: string;
  locationName?: string;
  type: string;
  status: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  skills: string[];
  categoryId?: string;
  locationId?: string;
  companyId?: string;
  employerId: string;
  createdAt: Date;
  expiredAt?: Date;
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
