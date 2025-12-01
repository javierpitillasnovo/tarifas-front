import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  OnDestroy
} from '@angular/core';

import { UiButtonComponent, ModalService } from '@agroseguro/lib-ui-agroseguro';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal-delete-combinacion-coeficiente',
  standalone: true,
  imports: [UiButtonComponent],
  templateUrl: './modal-delete-combinacion-coeficiente.component.html',
  styleUrl: './modal-delete-combinacion-coeficiente.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteCombinacionCoeficienteComponent implements OnDestroy {

  readonly #modalService = inject(ModalService);

  #destroy$ = new Subject<void>();

  /** Recibimos la combinación a eliminar (solo necesitamos nombre o id) */
  public combinacion = input.required<{ id: string }>();

  /** Output que devuelve true si el usuario confirma */
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
