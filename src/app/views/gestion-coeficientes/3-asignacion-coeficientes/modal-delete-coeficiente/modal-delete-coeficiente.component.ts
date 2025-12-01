import { ChangeDetectionStrategy, Component, inject, input, output, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UiButtonComponent, ModalService } from '@agroseguro/lib-ui-agroseguro';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal-delete-coeficiente',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent],
  templateUrl: './modal-delete-coeficiente.component.html',
  styleUrl: './modal-delete-coeficiente.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteCoeficienteComponent implements OnDestroy {

  readonly #modalService = inject(ModalService);

  #destroy$ = new Subject<void>();

  /** El elemento (coeficiente) que vamos a eliminar */
  public coeficiente = input.required<{ nombre: string }>();

  /** Output que devuelve true si se confirma la eliminación */
  public modalOutput = output<boolean>();

  confirmar() {
    this.modalOutput.emit(true);
  }

  cancelar() {
    this.#modalService.close();
  }

  ngOnDestroy() {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
