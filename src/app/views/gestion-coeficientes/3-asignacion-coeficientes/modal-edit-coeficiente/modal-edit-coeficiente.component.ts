import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  OnInit,
  model
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UiButtonComponent, UiInputComponent, ModalService } from '@agroseguro/lib-ui-agroseguro';

@Component({
  selector: 'app-modal-edit-coeficiente',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent, UiInputComponent],
  templateUrl: './modal-edit-coeficiente.component.html',
  styleUrl: './modal-edit-coeficiente.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalEditCoeficienteComponent implements OnInit {

  readonly #modalService = inject(ModalService);

  public coeficiente = input.required<{ id: string; nombre: string }>();

  public nombreEditado = model<string>('');

  public modalOutput = output<{ id: string; nombreCoeficiente: string }>();

  ngOnInit() {
    this.nombreEditado.set(this.coeficiente().nombre);
  }

    onNombreChange(event: any) {
    this.nombreEditado.set(event);
    }

  guardar() {
    if (!this.nombreEditado().trim()) return;

    this.modalOutput.emit({
      id: this.coeficiente().id,
      nombreCoeficiente: this.nombreEditado()
    });
  }

  cancelar() {
    this.#modalService.close();
  }
}
