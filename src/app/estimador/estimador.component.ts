import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EstimadorService } from '../service/estimador.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

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

  constructor(private estimadorService: EstimadorService) {}

  calcularEstimacion(): void {
    if (this.desarrolloHoras && this.desarrolloHoras > 0) {
      this.estimaciones = this.estimadorService.calcularEstimaciones(
        this.desarrolloHoras
      );
      this.calcularTotalHoras();
      console.log(this.desarrolloHoras);
    } else {
      this.estimaciones = null;
      this.totalHoras = 0;
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
