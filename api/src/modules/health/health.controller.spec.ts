import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports mongo connection state', () => {
    const controller = new HealthController({ readyState: 1 } as never);
    expect(controller.check()).toMatchObject({ status: 'ok', mongo: 'connected' });
  });
});
