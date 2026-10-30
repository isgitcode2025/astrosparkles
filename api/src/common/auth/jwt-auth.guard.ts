import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../modules/users/user.schema';

const STATUS_CACHE_MS = 30_000;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  /**
   * Short cache of account status and roles, read from the database rather than the token, so a
   * blocked user or a removed role takes effect within ~30 s (at once when cleared with forget()).
   */
  private static status = new Map<string, { status: string; roles: string[]; at: number }>();

  constructor(
    private readonly jwt: JwtService,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  /** Call after changing a user's status so the change applies immediately. */
  static forget(userId: string) {
    JwtAuthGuard.status.delete(userId);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('Login required');
    let payload: { sub: string; roles: string[] };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; roles: string[] }>(token);
    } catch {
      throw new UnauthorizedException('Session expired, please log in again');
    }
    const account = await this.accountOf(payload.sub);
    if (account.status === 'missing') throw new UnauthorizedException('Session expired, please log in again');
    if (account.status !== 'active') throw new ForbiddenException('This account is not active. Contact support.');
    req.user = { id: payload.sub, roles: account.roles };
    return true;
  }

  private async accountOf(id: string) {
    const hit = JwtAuthGuard.status.get(id);
    if (hit && Date.now() - hit.at < STATUS_CACHE_MS) return hit;
    const u = await this.users.findById(id).select('status roles').lean().catch(() => null);
    const entry = { status: u?.status ?? 'missing', roles: (u?.roles as string[] | undefined) ?? [], at: Date.now() };
    if (JwtAuthGuard.status.size > 5000) JwtAuthGuard.status.clear();
    JwtAuthGuard.status.set(id, entry);
    return entry;
  }
}
