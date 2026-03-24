import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PresentationOptionsComponent } from './presentation-options.component';

describe('PresentationOptionsComponent', () => {
  let component: PresentationOptionsComponent;
  let fixture: ComponentFixture<PresentationOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresentationOptionsComponent],
      providers: [provideNoopAnimations()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresentationOptionsComponent);
    component = fixture.componentInstance;
    component.presentationProfileControl = new FormControl('haip', {
      nonNullable: true,
    });
    component.requestUriMethodControl = new FormControl('get', {
      nonNullable: true,
    });
    component.authorizationSchemeControl = new FormControl('openid4vp://', {
      nonNullable: true,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
