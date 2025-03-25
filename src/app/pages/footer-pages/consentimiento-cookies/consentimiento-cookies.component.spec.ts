import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentimientoCookiesComponent } from './consentimiento-cookies.component';

describe('ConsentimientoCookiesComponent', () => {
  let component: ConsentimientoCookiesComponent;
  let fixture: ComponentFixture<ConsentimientoCookiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentimientoCookiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentimientoCookiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
