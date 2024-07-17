import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimadorComponent } from './estimador.component';

describe('EstimadorComponent', () => {
  let component: EstimadorComponent;
  let fixture: ComponentFixture<EstimadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstimadorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EstimadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
