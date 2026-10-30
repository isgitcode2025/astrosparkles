import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { Role } from '../users/user.schema';
import { AdminOrdersQuery, CreateShopOrderDto, IdParam, LessonProgressDto, ProductsQuery, UpdatePoojaOrderDto, UpsertProductDto } from './dto/shop.dto';
import { ShopService } from './shop.service';

@ApiTags('Shop')
@Controller('shop')
export class ShopController {
  constructor(
    private readonly shop: ShopService,
    private readonly jwt: JwtService,
  ) {}

  /** Optional login: product pages say "enrolled" for course owners. */
  private async optionalUserId(req: Request) {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return undefined;
    try {
      return (await this.jwt.verifyAsync<{ sub: string }>(h.slice(7))).sub;
    } catch {
      return undefined;
    }
  }

  @Get('products')
  @ApiOperation({ summary: 'Poojas and courses (public). Filter by type and category.' })
  list(@Query() q: ProductsQuery) {
    return this.shop.list(q.type, q.category);
  }

  @Get('products/:slug')
  @ApiBearerAuth('user')
  @ApiOperation({ summary: 'One product. Course videos are hidden unless the lesson is a free preview.' })
  async get(@Param('slug') slug: string, @Req() req: Request) {
    return this.shop.get(slug, await this.optionalUserId(req));
  }

  @Post('orders')
  @Auth()
  @ApiOperation({ summary: 'Book a pooja or buy a course, paid from the wallet' })
  buy(@CurrentUser() user: AuthUser, @Body() dto: CreateShopOrderDto) {
    return this.shop.buy(user.id, dto);
  }

  @Get('orders')
  @Auth()
  @ApiOperation({ summary: 'My orders, newest first' })
  myOrders(@CurrentUser() user: AuthUser) {
    return this.shop.myOrders(user.id);
  }

  @Get('orders/:id')
  @Auth()
  @ApiOperation({ summary: 'One of my orders (pooja status, recording link)' })
  myOrder(@CurrentUser() user: AuthUser, @Param() p: IdParam) {
    return this.shop.myOrder(user.id, p.id);
  }

  @Get('my-courses')
  @Auth()
  @ApiOperation({ summary: 'Courses I have bought, with progress' })
  myCourses(@CurrentUser() user: AuthUser) {
    return this.shop.myCourses(user.id);
  }

  @Get('courses/:slug/learn')
  @Auth()
  @ApiOperation({ summary: 'Course player data (lessons with video links) for enrolled users' })
  learn(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.shop.learn(user.id, slug);
  }

  @Post('courses/:slug/progress')
  @Auth()
  @ApiOperation({ summary: 'Mark a lesson complete or not complete' })
  progress(@CurrentUser() user: AuthUser, @Param('slug') slug: string, @Body() dto: LessonProgressDto) {
    return this.shop.progress(user.id, slug, dto.lessonId, dto.completed);
  }
}

@ApiTags('Admin')
@Controller('admin/shop')
export class AdminShopController {
  constructor(private readonly shop: ShopService) {}

  @Get('products')
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'All products including drafts' })
  list() {
    return this.shop.adminList();
  }

  @Post('products')
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'Create a pooja or course' })
  create(@Body() dto: UpsertProductDto) {
    return this.shop.upsert(dto);
  }

  @Put('products/:id')
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'Update a pooja or course' })
  update(@Param() p: IdParam, @Body() dto: UpsertProductDto) {
    return this.shop.upsert(dto, p.id);
  }

  @Get('orders')
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'Orders, filterable by type, status and pooja status' })
  orders(@Query() q: AdminOrdersQuery) {
    return this.shop.adminOrders(q);
  }

  @Patch('orders/:id/pooja')
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'Schedule a pooja, mark it performed, add the recording link' })
  updatePooja(@Param() p: IdParam, @Body() dto: UpdatePoojaOrderDto) {
    return this.shop.updatePooja(p.id, dto);
  }

  @Post('orders/:id/refund')
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'Refund an order to the user wallet' })
  refund(@Param() p: IdParam) {
    return this.shop.refund(p.id);
  }
}
