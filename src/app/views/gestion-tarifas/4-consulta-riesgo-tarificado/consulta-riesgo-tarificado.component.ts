import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
    ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GrupoSeguroService } from '../../../../core/services/grupo-seguro.service';
import { PlanLineaRiesgoService } from '../../../../core/services/plan-linea-riesgo.service';
import { TableDirective, UiTableComponent } from '@agroseguro/lib-ui-agroseguro';
import { VersionesService } from '../../../../core/services/versiones.service';
import { ModalAplicarCoeficientesComponent } from './modal-aplicar-coeficientes/modal-aplicar-coeficientes.component';
import { ModalAplicarLimitesComponent } from './modal-aplicar-limites/modal-aplicar-limites.component';
import { ModalService } from '@agroseguro/lib-ui-agroseguro';
import { PlanService } from '../../../../core/services/plan.service';
import { ModalVerDetalleComponent } from './modal-ver-detalle/modal-ver-detalle.component';



@Component({
    selector: 'app-consulta-riesgo-tarificado',
    standalone: true,
    imports: [CommonModule, UiTableComponent, TableDirective],
    templateUrl: './consulta-riesgo-tarificado.component.html',
    styleUrl: './consulta-riesgo-tarificado.component.scss',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'consulta-riesgo-tarificado' }
})
export class ConsultaRiesgoTarificadoComponent implements OnInit {

    readonly #grupoSeguroService = inject(GrupoSeguroService);
    readonly #planLineaRiesgoService = inject(PlanLineaRiesgoService);
    readonly #versionesService = inject(VersionesService);
    readonly #modalService = inject(ModalService);
    readonly #planService = inject(PlanService);

    public idPlanLinea = computed(() => this.#planService.idPlanLinea());
    public linea = computed(() => this.#grupoSeguroService.linea());
	public plan = computed(() => this.#grupoSeguroService.plan());
	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
	public planLineaRiesgo = computed(() => this.#planLineaRiesgoService.planLineaRiesgo());


    // Aquí guardamos la versión obtenida del endpoint
    public version = signal<string>('');
    public idVersion = signal<string>('');

    public data = computed(() => this.#versionesService.combinaciones());

    ngOnInit() {
        console.log('planLineaRiesgo: ', this.planLineaRiesgo());
        const idPlanLineaRiesgo = this.#planLineaRiesgoService.idPlanLineaRiesgo();
        if (idPlanLineaRiesgo) {
            this.#planLineaRiesgoService.getRiesgos(idPlanLineaRiesgo).subscribe({
                next: (versiones) => {
                    if (versiones?.length) {
                        this.version.set(versiones[0].version);
                        this.idVersion.set(versiones[0].idVersionRiesgo);
                    }
                }
            });
        }
    }

    openModalCoeficientes(row: any) {
          this.#modalService.open(ModalAplicarCoeficientesComponent,{
            idPlanLinea: signal(this.idPlanLinea()),
            idCombinacionTarifaSimple: signal(row.id),
            size:'l'
        })
    }

    openModalLimites(row: any) {
        this.#modalService.open(ModalAplicarLimitesComponent,{
            size:'l'
        });
    }

    openModalDetalle(row: any){
        this.#modalService.open(ModalVerDetalleComponent,{
            row: signal(row),
            version: signal(this.idVersion()),
            size:'l'
        });
    }

}
