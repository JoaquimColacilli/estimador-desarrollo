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
  desarrolloHoras: number = 0;
  estimaciones: any;

  constructor(private estimadorService: EstimadorService) {}

  calcularEstimacion(): void {
    if (this.desarrolloHoras) {
      this.estimaciones = this.estimadorService.calcularEstimaciones(
        this.desarrolloHoras
      );
    }
  }
}
