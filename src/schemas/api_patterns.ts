import { z } from 'zod';
import { HeaderObject } from './components.js';

// Bulk Operations Pattern
export const BulkOperationSchema = z.object({
  op: z.enum(['create', 'update', 'delete']),
  path: z.string(),
  value: z.record(z.string(), z.any()).optional(),
});

export const BulkRequestSchema = z.object({
  operations: z.array(BulkOperationSchema),
});

export const BulkResponseSchema = z.object({
  results: z.array(
    z.object({
      status: z.number().int(),
      path: z.string(),
      error: z.string().optional(),
    })
  ),
});

// Pagination Pattern
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1),
  per_page: z.number().int().min(1).max(100),
  sort: z.enum(['asc', 'desc']),
});

export const PaginationHeadersSchema = z
  .object({
    'X-Total-Count': HeaderObject,
    Link: HeaderObject,
  })
  .passthrough();
