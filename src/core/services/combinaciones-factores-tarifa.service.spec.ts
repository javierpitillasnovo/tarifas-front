import { TestBed } from '@angular/core/testing';
import { CombinacionesFactoresTarifaService } from './combinaciones-factores-tarifa.service';

describe('CombinacionesFactoresTarifaService', () => {
  let service: CombinacionesFactoresTarifaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CombinacionesFactoresTarifaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
