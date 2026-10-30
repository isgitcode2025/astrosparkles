import { Body, Controller, Delete, Get, HttpCode, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'My profile, wallet balance and free-consultation status' })
  async me(@CurrentUser() auth: AuthUser) {
    return UsersService.toPublic(await this.users.getById(auth.id));
  }

  @Patch('me')
  @Auth()
  @ApiOperation({ summary: 'Update my profile and birth details' })
  async update(@CurrentUser() auth: AuthUser, @Body() dto: UpdateProfileDto) {
    return UsersService.toPublic(await this.users.updateProfile(auth.id, dto));
  }

  @Delete('me')
  @Auth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete my account (required by Play Store / App Store policy)' })
  async remove(@CurrentUser() auth: AuthUser) {
    await this.users.softDelete(auth.id);
    return { deleted: true };
  }
}
