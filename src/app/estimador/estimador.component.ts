import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EstimadorService } from '../service/estimador.service';

@Component({
  selector: 'app-estimador',
  templateUrl: './estimador.component.html',
  styleUrls: ['./estimador.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class EstimadorComponent {
  desarrolloHoras: number | null = null;
  estimaciones: any = null;
  totalHoras: number = 0;
  showEstimaciones: boolean = false;
  animatingOut: boolean = false;

  constructor(private estimadorService: EstimadorService) {}

  calcularEstimacion(): void {
    if (this.desarrolloHoras && this.desarrolloHoras > 0) {
      this.estimaciones = this.estimadorService.calcularEstimaciones(
        this.desarrolloHoras
      );
      this.calcularTotalHoras();
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
    if (this.estimaciones) {
      this.totalHoras = (Object.values(this.estimaciones) as number[]).reduce(
        (acc, val) => acc + val,
        0
      );
    } else {
      this.totalHoras = 0;
    }
  }
}
