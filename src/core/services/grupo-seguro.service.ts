import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import { environment } from '../../environments/environment';
import type {
	iCombinacionFactorCoeficientes,
	iGrupoSeguro,
	iLinea,
	iRiesgoEditableResponse
} from '../interfaces/general.interface';

@Injectable({
	providedIn: 'root'
})
export class GrupoSeguroService {
	readonly #callApiService = inject(CallApiService);
	public grupoSeguro = signal<iGrupoSeguro>({ id: '', descripcion: '' });
	public linea = signal<iLinea>({ id: '', descripcion: '' });
	public plan = signal<string>('');
	public idCoeficienteSeleccionado = signal<string | null>(null);
	public nombreCoeficienteSeleccionado = signal<string>('');


	constructor() {}

	setIdCoeficienteSeleccionado(id: string) {
		this.idCoeficienteSeleccionado.set(id);
	}
	setNombreCoeficienteSeleccionado(nombre: string) {
		this.nombreCoeficienteSeleccionado.set(nombre);
	}
	/**
	 * GET /v1/grupos_seguro
	 * Devuelve [{ id: string; descripcion: string }]
	 * Lo mapeamos a { text, value } para el <ui-select>
	 */
	getGruposSeguros(): Observable<{ text: string; value: string }[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/grupos_seguro`
		};

		return this.#callApiService.callApi<iGrupoSeguro[]>(params).pipe(
			map((grupos) =>
				grupos.map((g) => ({
					text: g.descripcion,
					value: g.id
				}))
			)
		);
	}

	/**
	 * GET /v1/grupos_seguro/{idGrupoSeguro}/lineas
	 * Devuelve [{ id: number; descripcion: string }]
	 * Lo mapeamos a { text, value } para el <ui-select>
	 */
	getLineas(grupoCodigo: string): Observable<{ text: string; value: string }[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/grupos_seguro/${grupoCodigo}/lineas`
		};
		return this.#callApiService.callApi<iLinea[]>(params).pipe(
			map((lineas) =>
				lineas.map((l) => ({
					text: l.id + ' - ' + l.descripcion,
					value: l.id
				}))
			)
		);
	}

	/**
	 * GET /v1/grupos_seguro/{idGrupoSeguro}/riesgos

		*/
	getRiesgosPorGrupo(
		idGrupoSeguro: string,
		queryString?: string
	): Observable<iRiesgoEditableResponse> {
		const url = queryString
			? `${environment.API_URL}/v1/grupos_seguro/${idGrupoSeguro}/riesgos${queryString}`
			: `${environment.API_URL}/v1/grupos_seguro/${idGrupoSeguro}/riesgos`;

		const params: RequestApiParams = {
			method: RequestMethod.get,
			url
		};
		return this.#callApiService.callApi(params);
	}
	reset(): void {
		this.grupoSeguro.set({ id: '', descripcion: '' });
		this.plan.set('');
		this.linea.set({ id: '', descripcion: '' });
	}

	getCombinacionesFactoresCoeficiente(idCoeficiente: string) {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_simples/${idCoeficiente}/combinaciones_factores_tarifa_precio`
		};

		return this.#callApiService.callApi<iCombinacionFactorCoeficientes[]>(params);
	}

}
