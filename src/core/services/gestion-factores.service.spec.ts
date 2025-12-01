import { TestBed } from '@angular/core/testing';

import { GestionFactoresService } from './gestion-factores.service';

describe('GestionFactoresService', () => {
  let service: GestionFactoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionFactoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
