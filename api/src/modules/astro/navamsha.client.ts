import {
  BadRequestException,
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { Model } from 'mongoose';
import { AstroCache } from './astro-cache.schema';

/** Raw error from the provider, kept so callers can try another request shape on 422. */
export class ProviderValidationError extends BadRequestException {
  constructor(public readonly detail: unknown) {
    super('The astrology service rejected the request');
  }
}

/**
 * Thin client for the Navamsha REST API (https://api.navamsha.in).
 * - POST JSON with X-API-Key, response envelope { statusCode, output }
 * - Every successful response is cached in MongoDB by (path + body) to save credits
 * - Errors are mapped to friendly API errors; the key is never logged
 */
@Injectable()
export class NavamshaClient {
  private readonly logger = new Logger('Navamsha');

  constructor(
    private readonly config: ConfigService,
    @InjectModel(AstroCache.name) private readonly cache: Model<AstroCache>,
  ) {}

  get configured() {
    return Boolean(this.config.get<string>('astrologyApi.apiKey'));
  }

  private cacheKey(path: string, body: unknown) {
    return createHash('sha256').update(`${path}|${JSON.stringify(body)}`).digest('hex');
  }

  async post<T = unknown>(path: string, body: Record<string, unknown>, opts: { cache?: boolean } = {}): Promise<T> {
    const useCache = opts.cache !== false;
    const key = this.cacheKey(path, body);
    if (useCache) {
      const hit = await this.cache.findOne({ key }).lean();
      if (hit) return hit.output as T;
    }

    const apiKey = this.config.get<string>('astrologyApi.apiKey');
    if (!apiKey) throw new ServiceUnavailableException('Astrology service is not configured (ASTRO_API_KEY missing)');
    const base = (this.config.get<string>('astrologyApi.baseUrl') as string).replace(/\/$/, '');
    const timeout = this.config.get<number>('astrologyApi.timeoutMs') ?? 15000;

    let res: Response;
    try {
      res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeout),
      });
    } catch (e) {
      this.logger.error(`${path} network error: ${(e as Error).message}`);
      throw new BadGatewayException('Astrology service is not reachable. Please try again.');
    }

    const text = await res.text();
    let json: { statusCode?: number; output?: unknown; detail?: unknown } | null = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON (e.g. raw SVG) */
    }

    if (res.status === 422) throw new ProviderValidationError(json?.detail ?? text.slice(0, 500));
    if (res.status === 401 || res.status === 403) {
      this.logger.error(`${path} auth failed (${res.status})`);
      throw new ServiceUnavailableException('Astrology service authentication failed. Check ASTRO_API_KEY.');
    }
    if (res.status === 429) throw new HttpException('Astrology service is busy. Please try again in a moment.', HttpStatus.TOO_MANY_REQUESTS);
    if (res.status === 402) throw new ServiceUnavailableException('Astrology service credits are exhausted.');
    if (!res.ok) {
      this.logger.error(`${path} failed ${res.status}: ${text.slice(0, 300)}`);
      throw new BadGatewayException('Astrology service error. Please try again.');
    }

    const output = json && 'output' in json ? json.output : json ?? text;
    if (useCache) {
      const days = this.config.get<number>('astrologyApi.cacheDays') ?? 30;
      await this.cache
        .updateOne({ key }, { $set: { key, path, output, expiresAt: new Date(Date.now() + days * 86_400_000) } }, { upsert: true })
        .catch(() => undefined);
    }
    return output as T;
  }
}
