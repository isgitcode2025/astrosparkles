import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CONCERNS, EXPERTISE, GIFTS, LANGUAGES } from './master-data';

@ApiTags('Config')
@Controller('config')
export class MasterController {
  @Get('master')
  @ApiOperation({ summary: 'Reference lists: expertise, concerns, languages, gifts (English + Hindi labels)' })
  master() {
    return { expertise: EXPERTISE, concerns: CONCERNS, languages: LANGUAGES, gifts: GIFTS };
  }
}
