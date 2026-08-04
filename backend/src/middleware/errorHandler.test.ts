// backend/src/middleware/errorHandler.test.ts
import { Request, Response } from 'express';
import { errorHandler } from './errorHandler';
import { AppError } from '../shared/appError';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const req = { method: 'GET', path: '/x' } as Request;

describe('errorHandler', () => {
  it('maps an AppError to its status code and message', () => {
    const res = mockRes();
    errorHandler(new AppError('Nope', 403), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Nope' }));
  });

  it('maps an unknown error to 500 with a generic message', () => {
    const res = mockRes();
    errorHandler(new Error('secret internals'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Internal server error' })
    );
  });

  it('never leaks the raw error message as the client-facing error field on 500', () => {
    const res = mockRes();
    errorHandler(new Error('DB password leaked'), req, res, jest.fn());
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.error).toBe('Internal server error');
  });
});
