import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

/** Returns every error as { success: false, error: { code, message, details? } }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      typeof body === 'object' && body && 'message' in body
        ? (body as { message: string | string[] }).message
        : exception instanceof Error && status !== 500
          ? exception.message
          : 'Something went wrong';

    if (status >= 500) this.logger.error(exception);
    const friendly = status === HttpStatus.TOO_MANY_REQUESTS ? 'Too many attempts. Please wait a minute and try again.' : null;

    res.status(status).json({
      success: false,
      error: {
        code: HttpStatus[status] ?? 'ERROR',
        message: friendly ?? (Array.isArray(message) ? message[0] : message),
        ...(Array.isArray(message) && message.length > 1 ? { details: message } : {}),
      },
    });
  }
}
