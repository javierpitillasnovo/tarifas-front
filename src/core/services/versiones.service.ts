import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import { environment } from '../../environments/environment';
import type {
	iCombinacionFactor,
	iCombinacionFactorCoeficientes,
	iCombinacionFactorValorTarifa,
	PlanLineaRiesgoVersion
} from '../interfaces/general.interface';
import { signal } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class VersionesService {
	readonly #callApiService = inject(CallApiService);
	combinaciones = signal<iCombinacionFactorValorTarifa[]>([]);
	constructor() {}


	setCombinaciones(items: iCombinacionFactorValorTarifa[]) {
   		this.combinaciones.set(items);
	}

	getCombinaciones() {
		return this.combinaciones();
	}
	/**
	 * PUT /v1/versiones/{idVersionRiesgo}/seleccionar -> seleccionar version
	 * Devuelve [PlanLineaRiesgoVersion]
	 */
	updateSelectVersion(idVersionRiesgo: number): Observable<PlanLineaRiesgoVersion> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/versiones/${idVersionRiesgo}/seleccionar`
		};
		return this.#callApiService.callApi<PlanLineaRiesgoVersion>(params);
	}

	/**
	 * POST /v1/versiones
	 * Crea una version de un plan-línea-riesgo
	 */
	newVersion(version: string, idPlanLineaRiesgo: number): Observable<PlanLineaRiesgoVersion> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/versiones`,
			body: {
				version: version,
				idPlanLineaRiesgo: idPlanLineaRiesgo
			}
		};
		return this.#callApiService.callApi<PlanLineaRiesgoVersion>(params);
	}

	/**
	 * GET /v1/versiones/{idVersion}/combinaciones_factores_tarifa_simple
	 * Servicio que devuelve las combinaciones de factores y valores de tarifas de una version
	 */
	getCombinacionesFactorValorTarifa(
		idVersion: string
	): Observable<iCombinacionFactorValorTarifa[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/versiones/${idVersion}/combinaciones_factores_tarifa_simple`
		};
		return this.#callApiService.callApi<iCombinacionFactorValorTarifa[]>(params);
	}

	/**
	 * DELETE /v1/combinaciones_factores_tarifa_simples/{idCombinacionFactor}
	 * Elimina una combinación que forma una tarifa
	 */
	deleteCombinacionFactorValorTarifa(idCombinacionFactor: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_simples/${idCombinacionFactor}`
		};
		return this.#callApiService.callApi<void>(params);
	}

	/**
	 * POST /v1/combinaciones_factores_tarifa_simples/{idCombinacionFactor}
	 * Crea una combinación de factores de tarifa con sus grupos de valores
	 */
	newCombinacionFactorValorTarifa(
		combinacion: iCombinacionFactor
	): Observable<iCombinacionFactorValorTarifa> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_simples`,
			body: combinacion
		};
		return this.#callApiService.callApi<iCombinacionFactorValorTarifa>(params);
	}

	/**
	 * PUT /v1/combinaciones_factores_tarifa_simples/{idCombinacionFactor}
	 * Modifica una combinación de factores de tarifa con sus grupos de valores
	 */
	updateCombinacionFactorValorTarifa(
		idCombinacionFactor: string,
		combinacion: iCombinacionFactor
	): Observable<iCombinacionFactorValorTarifa> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_simples/${idCombinacionFactor}`,
			body: combinacion
		};
		return this.#callApiService.callApi<iCombinacionFactorValorTarifa>(params);
	}

	/**
	 * GET /v1/combinaciones_factores_tarifa_simples/{idCombinacion}/combinaciones_factores_tarifa_precio
	 * Servicio que devuelve las combinaciones de factores de precio y valores de tarifas de una combinacion simple
	 */
	getCombinacionesPrecio(idCombinacion: string): Observable<iCombinacionFactorValorTarifa[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_simples/${idCombinacion}/combinaciones_factores_tarifa_precio`
		};
		return this.#callApiService.callApi<iCombinacionFactorValorTarifa[]>(params);
	}

	/**
	 * GET /v1/combinaciones_factores_coeficientes/{idCoeficiente}
	 * Devuelve las combinaciones de factores disponibles para un coeficiente
	 */
	getCombinacionesFactoresCoeficiente(idCoeficiente: string) {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/combinaciones_factores_coeficientes/${idCoeficiente}`
		};

		return this.#callApiService.callApi<iCombinacionFactorCoeficientes[]>(params);
	}

	createCombinacionFactorCoeficiente(body: {
		idCoeficiente: string;
		coeficiente: number;
		asignaciones: { idFactorCoeficiente: string; idGrupoValores: string }[];
	}): Observable<iCombinacionFactorCoeficientes> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/combinaciones_factores_coeficientes`,
			body
		};

		return this.#callApiService.callApi(params);
	}

	/**
	 * PUT /v1/combinaciones_factores_coeficientes/{idCombinacionFactor}
	 * Modifica una combinación de factores de coeficientes con sus grupos de valores
	 */
	updateCombinacionFactorCoeficiente(
		idCombinacionFactor: string,
		body: {
			coeficiente: number;
			asignaciones?: { idFactorCoeficiente: string; idGrupoValores: string }[];
		}
	) {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/combinaciones_factores_coeficientes/${idCombinacionFactor}`,
			body
		};

		return this.#callApiService.callApi(params);
	}

	updateValues(body: { operacion: string; valor: number; combinaciones: string[] }) {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/combinaciones_factores_coeficientes`,
			body
		};

		return this.#callApiService.callApi(params);
	}

	deleteCombinacionFactorCoeficiente(idCombinacionFactor: string) {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/combinaciones_factores_coeficientes/${idCombinacionFactor}`
		};

		return this.#callApiService.callApi(params);
	}

	/*
	 * POST 
	 * /v1/combinaciones_factores_coeficientes/{idCoeficiente}/importar
	 * Importa combinaciones de coeficiente desde un archivo
	 */
	importCombinacion(idCoeficiente: string, file: File): Observable<void> {		
		const formData = new FormData();
		formData.append('fichero', file);
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/combinaciones_factores_coeficientes/${idCoeficiente}/importar`,
			body: formData
		};

		return this.#callApiService.callApi<void>(params);
	}
}
