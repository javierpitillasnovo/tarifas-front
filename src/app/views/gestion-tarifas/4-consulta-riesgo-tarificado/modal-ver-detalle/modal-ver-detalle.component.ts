import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  inject,
  input,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ViewChild
} from '@angular/core';

import {
	UiButtonComponent,
	UiTabsComponent,
	TabTemplateDirective,
	UiTagComponent
} from '@agroseguro/lib-ui-agroseguro';

import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';
import { PlanService } from '../../../../../core/services/plan.service';
import { GrupoSeguroService } from '../../../../../core/services/grupo-seguro.service';
import { Subject, takeUntil } from 'rxjs';

import {
  FactorTarifa,
  CoeficienteCombinacion,
  CoeficienteAsignadoUI
} from '../../../../../core/interfaces/general.interface';
import { ModalService } from '@agroseguro/lib-ui-agroseguro';


@Component({
  standalone: true,
  selector: 'app-modal-ver-detalle',
  templateUrl: './modal-ver-detalle.component.html',
  styleUrl: './modal-ver-detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    UiButtonComponent,
    UiTabsComponent,
    TabTemplateDirective,
    UiTagComponent
  ]
})
export class ModalVerDetalleComponent implements OnInit, OnDestroy {

  readonly #gestionFactoresService = inject(GestionFactoresService);
  readonly #modalService = inject(ModalService);
  readonly #planService = inject(PlanService);
  readonly #grupoSeguroService = inject(GrupoSeguroService);

  #destroy$ = new Subject<void>();

  /** inputs */
  public row = input.required<any>();
  public version = input.required<string>();

  /** data */
  public factoresSimples = signal<FactorTarifa[]>([]);
  public factoresPrecio = signal<FactorTarifa[]>([]);
  public coeficientes = signal<CoeficienteCombinacion[]>([]);

  /** loading flags */
  public loadedSimples = signal(false);
  public loadedPrecio = signal(false);
  public loadedCoef = signal(false);

  /** title */
  public codigo = computed(() => this.row().nombre);
  public factoresSimplesTabs = computed(
   () => this.factoresSimples().map(f => this.getTitle(f))
  );

  public factoresPrecioTabs = computed(
    () => this.factoresPrecio().map(f => this.getTitle(f))
  );

  ngOnInit(): void {
    this.loadFactoresSimples();
    this.loadFactoresPrecio();
    this.loadCoeficientes();
  }


  // ----------- FACTORES SIMPLES ----------
    private loadFactoresSimples() {
        this.loadedSimples.set(false);

        this.#gestionFactoresService
            .getFactoresTarifaByVersion(this.version(), 'SIMPLE')
            .pipe(takeUntil(this.#destroy$))
            .subscribe({
            next: data => {
                const factores = data.map(f => ({ ...f, grupoValores: [] }));
                this.factoresSimples.set(factores);

                factores.forEach(f => {
                this.#gestionFactoresService
                    .getGrupoValoresFactorTarifa(f.idFactorTarifa, 'SIMPLE', [])
                    .subscribe(values => {

                    // Actualizamos el grupoValores del factor correspondiente
                    this.factoresSimples.update(fs =>
                        fs.map(x =>
                        x.idFactorTarifa === f.idFactorTarifa
                            ? { ...x, grupoValores: values }
                            : x
                        )
                    );
                    });
                });

                this.loadedSimples.set(true);
            }
            });
    }

  // ----------- FACTORES PRECIO ----------
    private loadFactoresPrecio() {
        this.loadedPrecio.set(false);

        this.#gestionFactoresService
            .getFactoresTarifaByVersion(this.version(), 'PRECIO')
            .pipe(takeUntil(this.#destroy$))
            .subscribe({
            next: data => {
                const factores = data.map(f => ({ ...f, grupoValores: [] }));
                this.factoresPrecio.set(factores);

                factores.forEach(f => {
                this.#gestionFactoresService
                    .getGrupoValoresFactorTarifa(f.idFactorTarifa, 'PRECIO', [])
                    .subscribe(values => {

                    this.factoresPrecio.update(fp =>
                        fp.map(x =>
                        x.idFactorTarifa === f.idFactorTarifa
                            ? { ...x, grupoValores: values }
                            : x
                        )
                    );
                    });
                });

                this.loadedPrecio.set(true);
            }
            });
    }

  // ----------- COEFICIENTES ----------
    private loadCoeficientes() {
        this.loadedCoef.set(false);

        this.#gestionFactoresService
        .getCoeficientesCombinacion(this.row().id)
        .pipe(takeUntil(this.#destroy$))
        .subscribe({
            next: data => {
            const mapped: CoeficienteAsignadoUI[] = data.map(c => ({
                idCoeficienteLinea: c.idCoeficienteLinea,
                nombreCoeficiente: c.nombreCoeficiente
            }));

            this.coeficientes.set(mapped as any);

            this.loadedCoef.set(true);
            }
        });
    }


    getTitle(f: FactorTarifa): string {
        if (f.descripcionFactor && f.descripcionFactor.trim()) {
            return f.descripcionFactor.trim();
        }

        if (f.descripcionDeducible && f.descripcionDeducible.trim()) {
            return f.descripcionDeducible.trim();
        }

        return '';
    }



  cerrar(){
    this.#modalService.close();
  }

  ngOnDestroy(){
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
