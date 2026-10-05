import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Bọc controller async: mọi lỗi được chuyển sang middleware xuLyLoi */
export function batDongBo(
  hamXuLy: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(hamXuLy(req, res, next)).catch(next);
  };
}
