import { TestBed } from '@angular/core/testing';

import { ProductCacheService } from './product-cache.service';

describe('ProductCacheService', () => {
  let service: ProductCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
