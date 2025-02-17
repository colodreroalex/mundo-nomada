import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCategoriaComponent } from './add-categorias.component';

describe('AddCategoriasComponent', () => {
  let component: AddCategoriaComponent;
  let fixture: ComponentFixture<AddCategoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCategoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCategoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
