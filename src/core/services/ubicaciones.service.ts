import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import type {
	iComarca,
	iProvincia,
	iSubtermino,
	iTermino} from '../interfaces/general.interface';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class UbicacionesService {
	readonly #callApiService = inject(CallApiService);
	
	constructor() {}
	
	/**
	 * GET /v1/provincias
	 * Servicio que devuelve todos las provincias
	 */
	getProvincias(): Observable<iProvincia[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/provincias`
		};
		return this.#callApiService.callApi<iProvincia[]>(params);
	}

	/**
	 * GET /v1/provincias/{provinciaId}/comarcas
	 * Servicio que devuelve todas las comarcas por provincia
	 */
	getComarcas(provinciaId:string): Observable<iComarca[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/provincias/${provinciaId}/comarcas`
		};
		return this.#callApiService.callApi<iComarca[]>(params);
	}

	/**
	 * GET /v1/provincias/{provinciaId}/comarcas/{comarcaId}/terminos
	 * Servicio que devuelve todas los terminos por provincia/comarca/
	 */

	getTerminos(provinciaId:string,comarcaId:number): Observable<iTermino[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/provincias/${provinciaId}/comarcas/${comarcaId}/terminos`
		};
		return this.#callApiService.callApi<iTermino[]>(params);
	}

	/**
	 * GET /v1/provincias/{provinciaId}/comarcas/{comarcaId}/terminos/{terminoId}/subterminos
	 * Servicio que devuelve todas los subterminos por provincia/comarca/termino
	 */

	getSubterminos(provinciaId:string,comarcaId:number,terminoId:number): Observable<iSubtermino[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/provincias/${provinciaId}/comarcas/${comarcaId}/terminos/${terminoId}/subterminos`
		};
		return this.#callApiService.callApi<iSubtermino[]>(params);
	}
}
