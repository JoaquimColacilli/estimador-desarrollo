import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EstimadorService {
  calcularEstimaciones(desarrolloHoras: number): any {
    const analisisFuncional = Math.round(desarrolloHoras * 0.1);
    const analisisTecnico = Math.round(desarrolloHoras * 0.1);
    const pruebasUnitarias = Math.round(desarrolloHoras * 0.1);
    const pruebasIntegracion = Math.round(desarrolloHoras * 0.1);
    const implementacionYSoporte = Math.round(desarrolloHoras * 0.15);
    const gestion = Math.round(desarrolloHoras * 0.15);

    return {
      analisisFuncional,
      analisisTecnico,
      desarrollo: Math.round(desarrolloHoras),
      pruebasUnitarias,
      pruebasIntegracion,
      implementacionYSoporte,
      gestion,
    };
  }
}
