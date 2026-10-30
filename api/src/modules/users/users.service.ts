import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from './user.schema';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  findById(id: string) {
    return this.users.findById(id);
  }

  async getById(id: string): Promise<UserDocument> {
    const user = await this.users.findById(id);
    if (!user || user.status === 'deleted') throw new NotFoundException('User not found');
    return user;
  }

  async findOrCreateByPhone(phone: string): Promise<{ user: UserDocument; isNew: boolean }> {
    const existing = await this.users.findOne({ phone });
    if (existing) return { user: existing, isNew: false };
    return { user: await this.users.create({ phone }), isNew: true };
  }

  async findOrCreateByGoogle(p: { googleId: string; email?: string; name?: string; avatarUrl?: string }) {
    let user = await this.users.findOne({ googleId: p.googleId });
    if (user) return { user, isNew: false };
    // Link to an existing account with the same verified email
    if (p.email) {
      user = await this.users.findOne({ email: p.email.toLowerCase() });
      if (user) {
        user.googleId = p.googleId;
        await user.save();
        return { user, isNew: false };
      }
    }
    user = await this.users.create({ googleId: p.googleId, email: p.email, name: p.name, avatarUrl: p.avatarUrl });
    return { user, isNew: true };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.getById(id);
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const taken = await this.users.exists({ email: dto.email.toLowerCase(), _id: { $ne: user._id } });
      if (taken) throw new ConflictException('This email is already used by another account');
    }
    const { birth, ...rest } = dto;
    Object.assign(user, rest);
    if (birth) user.birth = { ...(user.birth ?? {}), ...birth };
    await user.save();
    return user;
  }

  async softDelete(id: string) {
    const user = await this.getById(id);
    user.status = 'deleted';
    user.phone = undefined;
    user.email = undefined;
    user.googleId = undefined;
    user.name = 'Deleted user';
    await user.save();
    JwtAuthGuard.forget(id);
  }

  /** Public, safe shape for API responses. */
  static toPublic(user: UserDocument) {
    return {
      id: user.id as string,
      phone: user.phone,
      email: user.email,
      name: user.name,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      birth: user.birth,
      language: user.language,
      roles: user.roles,
      walletBalance: user.walletBalancePaise / 100,
      freeConsultationAvailable: !user.freeConsultationUsed,
      profileComplete: Boolean(user.name && user.birth?.dateOfBirth),
    };
  }
}
