import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionFactoresDefinicionComponent } from './gestion-factores-definicion.component';

describe('GestionFactoresDefinicionComponent', () => {
  let component: GestionFactoresDefinicionComponent;
  let fixture: ComponentFixture<GestionFactoresDefinicionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionFactoresDefinicionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionFactoresDefinicionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
