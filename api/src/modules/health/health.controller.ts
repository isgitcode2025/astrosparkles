import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly mongo: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Service health check' })
  check() {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return {
      status: 'ok',
      mongo: states[this.mongo.readyState] ?? 'unknown',
      uptimeSeconds: Math.round(process.uptime()),
      time: new Date().toISOString(),
    };
  }
}
