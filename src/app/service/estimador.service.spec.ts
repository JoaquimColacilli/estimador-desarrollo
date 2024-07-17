import { TestBed } from '@angular/core/testing';

import { EstimadorService } from './estimador.service';

describe('EstimadorService', () => {
  let service: EstimadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstimadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
