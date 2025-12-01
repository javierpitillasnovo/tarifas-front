import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDefinicionFactoresComponent } from './modal-definicion-factores.component';

describe('ModalDefinicionFactoresComponent', () => {
  let component: ModalDefinicionFactoresComponent;
  let fixture: ComponentFixture<ModalDefinicionFactoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDefinicionFactoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDefinicionFactoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
