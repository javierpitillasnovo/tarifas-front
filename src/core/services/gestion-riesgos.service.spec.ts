import { TestBed } from '@angular/core/testing';

import { GestionRiesgosService } from './gestion-riesgos.service';

describe('GestionRiesgosService', () => {
  let service: GestionRiesgosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionRiesgosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
