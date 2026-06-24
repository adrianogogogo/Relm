import { WarrantyService } from './warranty.service';

describe('WarrantyService', () => {
  it('should be defined', () => {
    const service = new WarrantyService({} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    expect(service).toBeDefined();
  });
});
