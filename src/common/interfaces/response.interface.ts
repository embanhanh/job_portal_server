export interface IApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: IPaginationMeta;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ITranslatableField {
  vi: string;
  en: string;
  [key: string]: string;
}
