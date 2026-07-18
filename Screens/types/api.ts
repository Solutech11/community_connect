export type ApiSuccess<T = undefined> = {
  success: true;
  message: string;
  data?: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
};

export type QueryValue = string | number | boolean | null | undefined;

export type ImageUpload = {
  uri: string;
  name: string;
  type: string;
};

