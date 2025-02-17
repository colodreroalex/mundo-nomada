import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostrarProductsComponent } from './mostrar-products.component';

describe('MostrarProductsComponent', () => {
  let component: MostrarProductsComponent;
  let fixture: ComponentFixture<MostrarProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MostrarProductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MostrarProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
