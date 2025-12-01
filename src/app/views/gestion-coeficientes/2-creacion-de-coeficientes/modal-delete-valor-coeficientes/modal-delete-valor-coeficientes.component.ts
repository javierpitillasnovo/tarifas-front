import { ChangeDetectionStrategy, Component, inject, input, output, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UiButtonComponent, ModalService } from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { GrupoValoresCoeficientes } from '../../../../../core/interfaces/general.interface';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

@Component({
  selector: 'app-modal-delete-valor-coeficientes',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent],
  templateUrl: './modal-delete-valor-coeficientes.component.html',
  styleUrl: './modal-delete-valor-coeficientes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteValorCoeficientesComponent implements OnDestroy {

  readonly #gestionFactoresService = inject(GestionFactoresService);
  readonly #modalService = inject(ModalService);

  #destroy$ = new Subject<void>();

  public valor = input.required<GrupoValoresCoeficientes>();
  public modalOutput = output<boolean>();

 deleteValor() {
  this.modalOutput.emit(true);
 }

  cancel() {
    this.#modalService.close();
  }

  ngOnDestroy() {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
