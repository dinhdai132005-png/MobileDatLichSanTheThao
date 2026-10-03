// =====================================================================
// VALIDATION MIDDLEWARE (ZOD) — Tham chiếu: Plant/AGENT.md mục 4 & 06-api.md
// =====================================================================
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError, ValidationErrorItem } from '../utils/errors';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.issues) {
        const issues = error.issues || [];
        const errors: ValidationErrorItem[] = issues.map((err: any) => ({
          field: err.path ? err.path.join('.') : 'field',
          message: err.message,
        }));
        const firstMessage = errors[0]?.message || 'Dữ liệu không hợp lệ';
        return next(ApiError.badRequest(firstMessage, 'VALIDATION_ERROR', errors));
      }
      return next(error);
    }
  };
}
