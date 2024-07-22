import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstimadorService } from '../service/estimador.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estimador',
  templateUrl: './estimador.component.html',
  styleUrls: ['./estimador.component.css'],
  standalone: true,
  imports: [FormsModule, NgChartsModule, CommonModule],
})
export class EstimadorComponent {
  desarrolloHoras: number | null = null;
  frontendHoras: number | null = null;
  estimaciones: any = null;
  totalHoras: number = 0;
  totalBackendHoras: number = 0;
  totalFrontendHoras: number = 0;
  showEstimaciones: boolean = false;
  animatingOut: boolean = false;
  showTareasCard: boolean = false;
  showFrontendTareasCard: boolean = false;
  showFrontend: boolean = false;
  tareaNombre: string = '';
  tareaHoras: number | null = null;
  tareas: { nombre: string; horas: number }[] = [];
  tareaNombreFrontend: string = '';
  tareaHorasFrontend: number | null = null;
  tareasFrontend: { nombre: string; horas: number }[] = [];
  isBrowser: boolean;

  public pieChartLabels: string[] = [
    'Análisis Funcional',
    'Análisis Técnico',
    'Desarrollo Backend',
    'Desarrollo Front',
    'Pruebas Unitarias',
    'Pruebas de Integración',
    'Implementación y Soporte',
    'Gestión',
  ];
  public pieChartData: ChartData<'pie'> = {
    labels: this.pieChartLabels,
    datasets: [{ data: [] }],
  };
  public pieChartType: ChartType = 'pie';

  constructor(
    private estimadorService: EstimadorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  handleFrontendSwitch(): void {
    if (!this.showFrontend) {
      this.showFrontendTareasCard = false;
    }
    this.calcularEstimacion();
  }

  calcularEstimacion(): void {
    if (
      (this.desarrolloHoras && this.desarrolloHoras > 0) ||
      (this.frontendHoras && this.frontendHoras > 0)
    ) {
      this.estimaciones = this.estimadorService.calcularEstimaciones(
        this.desarrolloHoras || 0
      );
      this.calcularTotalHoras();
      if (this.isBrowser) {
        this.updatePieChartData();
      }
      this.showEstimaciones = true;
    } else {
      this.animatingOut = true;
      setTimeout(() => {
        this.animatingOut = false;
        this.estimaciones = null;
        this.showEstimaciones = false;
        this.totalHoras = 0;
        this.totalBackendHoras = 0;
        this.totalFrontendHoras = 0;
      }, 500); // Duración de la animación
    }
  }

  calcularTotalHoras(): void {
    let totalTareasHoras = this.tareas.reduce(
      (acc, tarea) => acc + tarea.horas,
      0
    );
    let totalTareasFrontendHoras = this.tareasFrontend.reduce(
      (acc, tarea) => acc + tarea.horas,
      0
    );

    if (this.estimaciones) {
      this.estimaciones.desarrolloBackend =
        (this.desarrolloHoras ?? 0) + totalTareasHoras;
      this.estimaciones.desarrolloFront =
        (this.frontendHoras ?? 0) + totalTareasFrontendHoras;

      this.totalBackendHoras =
        (Object.values(this.estimaciones) as number[]).reduce(
          (acc, val) => acc + val,
          0
        ) - this.estimaciones.desarrolloFront;

      if (!this.showFrontend) {
        this.totalFrontendHoras = 0;
      } else {
        this.totalFrontendHoras = this.estimaciones.desarrolloFront;
      }

      this.totalHoras = this.totalBackendHoras + this.totalFrontendHoras;
    } else {
      this.totalBackendHoras = totalTareasHoras;
      this.totalFrontendHoras = this.frontendHoras
        ? this.frontendHoras + totalTareasFrontendHoras
        : totalTareasFrontendHoras;

      if (!this.showFrontend) {
        this.totalFrontendHoras = 0;
      }

      this.totalHoras = this.totalBackendHoras + this.totalFrontendHoras;
    }
  }

  updatePieChartData(): void {
    if (this.estimaciones) {
      this.pieChartData = {
        labels: this.pieChartLabels,
        datasets: [
          {
            data: [
              this.estimaciones.analisisFuncional,
              this.estimaciones.analisisTecnico,
              this.estimaciones.desarrolloBackend,
              this.estimaciones.desarrolloFront,
              this.estimaciones.pruebasUnitarias,
              this.estimaciones.pruebasIntegracion,
              this.estimaciones.implementacionYSoporte,
              this.estimaciones.gestion,
            ],
          },
        ],
      };
    } else {
      this.pieChartData = {
        labels: this.pieChartLabels,
        datasets: [{ data: [] }],
      };
    }
  }

  toggleTareasCard(): void {
    this.showTareasCard = !this.showTareasCard;
  }

  toggleFrontendTareasCard(): void {
    this.showFrontendTareasCard = !this.showFrontendTareasCard;
  }

  agregarTarea(type: 'backend' | 'frontend'): void {
    if (
      type === 'backend' &&
      this.tareaNombre &&
      this.tareaHoras &&
      this.tareaHoras > 0
    ) {
      this.tareas.push({ nombre: this.tareaNombre, horas: this.tareaHoras });
      this.tareaNombre = '';
      this.tareaHoras = null;
      this.estimaciones.desarrolloBackend += this.tareas.reduce(
        (acc, tarea) => acc + tarea.horas,
        0
      );
      this.calcularTotalHoras();
      this.updatePieChartData();
    } else if (
      type === 'frontend' &&
      this.tareaNombreFrontend &&
      this.tareaHorasFrontend &&
      this.tareaHorasFrontend > 0
    ) {
      this.tareasFrontend.push({
        nombre: this.tareaNombreFrontend,
        horas: this.tareaHorasFrontend,
      });
      this.tareaNombreFrontend = '';
      this.tareaHorasFrontend = null;
      this.estimaciones.desarrolloFront += this.tareasFrontend.reduce(
        (acc, tarea) => acc + tarea.horas,
        0
      );
      this.calcularTotalHoras();
      this.updatePieChartData();
    }
  }

  eliminarTarea(type: 'backend' | 'frontend', index: number): void {
    if (type === 'backend') {
      const removedHours = this.tareas[index].horas;
      this.tareas.splice(index, 1);
      this.estimaciones.desarrolloBackend -= removedHours;
    } else if (type === 'frontend') {
      const removedHours = this.tareasFrontend[index].horas;
      this.tareasFrontend.splice(index, 1);
      this.estimaciones.desarrolloFront -= removedHours;
    }
    this.calcularTotalHoras();
    this.updatePieChartData();
  }
}
