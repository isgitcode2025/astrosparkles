import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import configuration from '../../config/configuration';
import { BrandController } from './brand.controller';

describe('BrandController', () => {
  let controller: BrandController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration], ignoreEnvFile: true })],
      controllers: [BrandController],
    }).compile();
    controller = moduleRef.get(BrandController);
  });

  it('returns default AstroSparkles brand with English and Hindi', () => {
    const brand = controller.getBrand();
    expect(brand.name).toBe('AstroSparkles');
    expect(brand.languages).toEqual(['en', 'hi']);
    expect(brand.colors.primary).toMatch(/^#/);
  });

  it('never exposes secrets in public keys', () => {
    const keys = controller.getPublicKeys();
    expect(Object.keys(keys).sort()).toEqual(['agoraAppId', 'googleWebClientId', 'razorpayKeyId']);
  });
});
