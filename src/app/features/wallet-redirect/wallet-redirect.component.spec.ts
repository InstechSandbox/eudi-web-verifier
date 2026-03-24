import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { WalletRedirectComponent } from './wallet-redirect.component';
import { ConcludedTransaction } from '@core/models/ConcludedTransaction';
import { provideHttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

describe('WalletRedirectComponent', () => {
  let component: WalletRedirectComponent;
  let fixture: ComponentFixture<WalletRedirectComponent>;

  beforeEach(async () => {
    const toastrService = jasmine.createSpyObj<ToastrService>(
      'ToasterService',
      ['error', 'success']
    );
    const concludedTransaction: ConcludedTransaction = {
      transactionId: 'transaction_id',
      nonce: 'nonce',
      presentationQuery: {
        credentials: [],
        credential_sets: [],
      },
      walletResponse: {
        id_token: 'id_token',
        vp_token: { query_0: ['vp_token'] },
      },
    };
    await TestBed.configureTestingModule({
      imports: [WalletRedirectComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { data: concludedTransaction } },
          },
        },
        { provide: ToastrService, useValue: toastrService },
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WalletRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
