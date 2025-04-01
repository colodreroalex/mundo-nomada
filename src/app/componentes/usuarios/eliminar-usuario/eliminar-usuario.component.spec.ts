import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarUsuarioComponent } from './eliminar-usuario.component';

describe('EliminarUsuarioComponent', () => {
  let component: EliminarUsuarioComponent;
  let fixture: ComponentFixture<EliminarUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarUsuarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
