import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import { environment } from '../../environments/environment';
import type {
	iCombinacionFactorTarifaPrecio,
	iCombinacionFactorValorTarifa
} from '../interfaces/general.interface';

@Injectable({
	providedIn: 'root'
})
export class CombinacionesFactoresTarifaService {
	readonly #callApiService = inject(CallApiService);
	constructor() {}

	/**
	 * POST /v1/combinaciones_factores_tarifa_precio
	 * Crea una combinación de factores de tarifa con sus grupos de valores
	 */
	newCombinacionFactorPrecio(
		combinacion: iCombinacionFactorTarifaPrecio
	): Observable<iCombinacionFactorValorTarifa> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_precio`,
			body: combinacion
		};
		return this.#callApiService.callApi<iCombinacionFactorValorTarifa>(params);
	}

	/**
	 * PUT /v1/combinaciones_factores_tarifa_precio/{idCombinacionFactor}
	 * Modifica una combinación de factores de tarifa con sus grupos de valores
	 */
	updateCombinacionFactorPrecio(
		idCombinacionFactor: string,
		combinacion: iCombinacionFactorTarifaPrecio
	): Observable<iCombinacionFactorValorTarifa> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_precio/${idCombinacionFactor}`,
			body: combinacion
		};
		return this.#callApiService.callApi<iCombinacionFactorValorTarifa>(params);
	}

	/**
	 * PUT /v1/combinaciones_factores_tarifa_precio
	 * Modifica la tarifa base de un conjunto de combinaciones
	 */
	updateValues(body: { operacion: string; valor: number; combinaciones: string[] }) {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_precio`,
			body
		};

		return this.#callApiService.callApi(params);
	}

	/**
	 * DELETE /v1/combinaciones_factores_tarifa_precio/{idCombinacionFactor}
	 * Elimina una combinación que forma una tarifa
	 */
	deleteCombinacionFactorPrecio(idCombinacionFactor: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_precio/${idCombinacionFactor}`
		};
		return this.#callApiService.callApi<void>(params);
	}

	/*
	 * POST /v1/combinaciones_factores_tarifa_simples/{idCombinacion}/importar 
	 * Importa combinaciones de factores de tarifa desde un archivo
	 */
	importCombinacion(idCombinacion: string, file: File): Observable<void> {		
		const formData = new FormData();
		formData.append('fichero', file);
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/combinaciones_factores_tarifa_simples/${idCombinacion}/importar`,
			body: formData
		};

		return this.#callApiService.callApi<void>(params);
	}
}
