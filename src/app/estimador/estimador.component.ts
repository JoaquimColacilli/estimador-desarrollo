import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EstimadorService } from '../service/estimador.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-estimador',
  templateUrl: './estimador.component.html',
  styleUrls: ['./estimador.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
})
export class EstimadorComponent {
  desarrolloHoras: number | null = null;
  estimaciones: any = null;
  totalHoras: number = 0;
  showEstimaciones: boolean = false;
  animatingOut: boolean = false;

  showTareasCard: boolean = false;
  tareaNombre: string = '';
  tareaHoras: number | null = null;
  tareas: { nombre: string; horas: number }[] = [];

  public pieChartLabels: string[] = [
    'Análisis Funcional',
    'Análisis Técnico',
    'Desarrollo',
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

  constructor(private estimadorService: EstimadorService) {}

  calcularEstimacion(): void {
    if (this.desarrolloHoras && this.desarrolloHoras > 0) {
      this.estimaciones = this.estimadorService.calcularEstimaciones(
        this.desarrolloHoras
      );
      this.calcularTotalHoras();
      this.updatePieChartData();
      this.showEstimaciones = true;
    } else {
      this.animatingOut = true;
      setTimeout(() => {
        this.animatingOut = false;
        this.estimaciones = null;
        this.showEstimaciones = false;
        this.totalHoras = 0;
      }, 500); // Duración de la animación
    }
  }

  calcularTotalHoras(): void {
    let totalTareasHoras = this.tareas.reduce(
      (acc, tarea) => acc + tarea.horas,
      0
    );
    if (this.estimaciones) {
      this.totalHoras =
        (Object.values(this.estimaciones) as number[]).reduce(
          (acc, val) => acc + val,
          0
        ) + totalTareasHoras;
    } else {
      this.totalHoras = totalTareasHoras;
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
              this.estimaciones.desarrollo,
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

  agregarTarea(): void {
    if (this.tareaNombre && this.tareaHoras && this.tareaHoras > 0) {
      this.tareas.push({ nombre: this.tareaNombre, horas: this.tareaHoras });
      this.tareaNombre = '';
      this.tareaHoras = null;
      this.calcularTotalHoras();
    }
  }
}
