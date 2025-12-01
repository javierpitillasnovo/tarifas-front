import { TestBed } from '@angular/core/testing';
import { PlanLineaRiesgoService } from './plan-linea-riesgo.service';

describe('PlanLineaRiesgoService', () => {
  let service: PlanLineaRiesgoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanLineaRiesgoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
