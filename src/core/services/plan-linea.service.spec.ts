import { TestBed } from '@angular/core/testing';
import { PlanLineaService } from './plan-linea.service';

describe('PlanLineaService', () => {
  let service: PlanLineaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanLineaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
