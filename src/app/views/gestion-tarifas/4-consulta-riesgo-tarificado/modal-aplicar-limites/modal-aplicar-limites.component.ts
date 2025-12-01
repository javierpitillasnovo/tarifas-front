import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiButtonComponent, UiSelectComponent } from '@agroseguro/lib-ui-agroseguro';
import { ModalService } from '@agroseguro/lib-ui-agroseguro';

@Component({
  selector: 'app-modal-aplicar-limites',
  standalone: true,
  imports: [UiButtonComponent, UiSelectComponent],
  templateUrl: './modal-aplicar-limites.component.html',
  styleUrl: './modal-aplicar-limites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAplicarLimitesComponent {

  readonly #modalService = inject(ModalService);

  cancel(){
    this.#modalService.close();
  }

  apply(){
    this.#modalService.close();
  }
}
