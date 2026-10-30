import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';

@ApiTags('Places')
@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get('search')
  @ApiQuery({ name: 'q', example: 'Indo' })
  @ApiOperation({ summary: 'Birth place autocomplete (city, coordinates, time zone). Public.' })
  search(@Query('q') q = '') {
    return this.places.search(String(q).slice(0, 60), 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One place by id' })
  get(@Param('id') id: string) {
    return this.places.getById(id);
  }
}
