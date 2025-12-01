import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGestionFactoresComponent } from './modal-gestion-factores.component';

describe('ModalGestionFactoresComponent', () => {
  let component: ModalGestionFactoresComponent;
  let fixture: ComponentFixture<ModalGestionFactoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalGestionFactoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGestionFactoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
