import { TestBed } from '@angular/core/testing';
import { GrupoSeguroService } from './grupo-seguro.service';

describe('GrupoSeguroService', () => {
  let service: GrupoSeguroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GrupoSeguroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
