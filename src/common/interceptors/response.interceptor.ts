/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, switchMap } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
import { IApiResponse } from '../interfaces/response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  IApiResponse<T>
> {
  constructor(private readonly i18n: I18nService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const request = httpContext.getRequest();
    const statusCode: number = response.statusCode;

    // Resolve language from nestjs-i18n (supports Accept-Language + ?lang=)
    const lang: string =
      request.i18nLang ??
      request.headers?.['accept-language']?.split(',')[0]?.trim() ??
      'en';

    return next.handle().pipe(
      switchMap(async (responseData) => {
        // If the response already has the correct structure, pass it through
        if (
          responseData?.success !== undefined &&
          responseData?.statusCode !== undefined
        ) {
          return responseData;
        }

        let messageKey = this.getMessageKey(request.method);
        let finalData = responseData;

        // Extract custom message if present
        if (
          responseData &&
          typeof responseData === 'object' &&
          responseData.message
        ) {
          messageKey = responseData.message as string;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { message: _, ...rest } = responseData;
          // If there are other fields, they go into data. If not, data is null.
          finalData = Object.keys(rest).length > 0 ? rest : null;
        }

        // Translate success message
        const message = await this.i18n.translate(messageKey, { lang });

        // Handle paginated results (they contain data + meta)
        if (finalData?.data && finalData?.meta) {
          return {
            success: true,
            statusCode,
            message,
            data: finalData.data,
            meta: finalData.meta,
          };
        }

        return {
          success: true,
          statusCode,
          message,
          data: finalData,
        };
      }),
    );
  }

  private getMessageKey(method: string): string {
    switch (method) {
      case 'POST':
        return 'common.created';
      case 'PATCH':
      case 'PUT':
        return 'common.updated';
      case 'DELETE':
        return 'common.deleted';
      default:
        return 'common.success';
    }
  }
}
