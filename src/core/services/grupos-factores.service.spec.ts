import { TestBed } from '@angular/core/testing';
import { GruposFactoresService } from './grupos-factores.service';


describe('GruposFactoresService', () => {
  let service: GruposFactoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GruposFactoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
