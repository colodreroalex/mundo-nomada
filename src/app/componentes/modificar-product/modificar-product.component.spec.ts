import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarProductComponent } from './modificar-product.component';

describe('ModificarProductComponent', () => {
  let component: ModificarProductComponent;
  let fixture: ComponentFixture<ModificarProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModificarProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModificarProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
