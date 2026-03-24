import { TestBed } from '@angular/core/testing';
import { WalletResponseProcessorService } from './wallet-response-processor.service';
import { DecodersRegistryService } from '@core/services/decoders-registry.service';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { ConcludedTransaction } from '@core/models/ConcludedTransaction';
import { AttestationFormat } from '@core/models/attestation/AttestationFormat';

describe('WalletResponseProcessorService', () => {
  let service: WalletResponseProcessorService;
  let decodersRegistryServiceSpy: jasmine.SpyObj<DecodersRegistryService>;

  beforeEach(() => {
    const decodersSpy = jasmine.createSpyObj('DecodersRegistryService', [
      'decoderOf',
    ]);

    const toastrSpy = jasmine.createSpyObj('ToastrService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        WalletResponseProcessorService,
        { provide: DecodersRegistryService, useValue: decodersSpy },
        { provide: ToastrService, useValue: toastrSpy },
      ],
    });

    service = TestBed.inject(WalletResponseProcessorService);
    decodersRegistryServiceSpy = TestBed.inject(
      DecodersRegistryService
    ) as jasmine.SpyObj<DecodersRegistryService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('mapVpTokenToAttestations', () => {
    describe('dcql', () => {
      it('should map VP token to attestations for mso mdoc dcql', (done) => {
        const mockConcludedTransaction: ConcludedTransaction = {
          transactionId: 'mockTransactionId',
          nonce: 'mockNonce',
          presentationQuery: {
            credentials: [
              {
                id: 'query_0',
                format: 'mso_mdoc',
                meta: {
                  doctype_value: 'eu.europa.ec.eudi.pid.1',
                },
                claims: [
                  {
                    path: ['eu.europa.ec.eudi.pid.1', 'family_name'],
                    intent_to_retain: false,
                  },
                  {
                    path: ['eu.europa.ec.eudi.pid.1', 'given_name'],
                    intent_to_retain: false,
                  },
                ],
              },
            ],
          },
          walletResponse: {
            vp_token: {
              query_0: ['mock_vp_token'],
            },
          },
        };

        decodersRegistryServiceSpy.decoderOf.and.returnValue({
          decode: jasmine
            .createSpy('decode')
            .and.returnValue(
              of({
                kind: 'single',
                format: AttestationFormat.MSO_MDOC,
                name: 'decodedValueForDcql',
                attributes: [],
                metadata: [],
              })
            ),
          supports: (format: AttestationFormat) =>
            format === AttestationFormat.MSO_MDOC,
        });

        service
          .mapVpTokenToAttestations(mockConcludedTransaction)['query_0']
          .subscribe((result) => {
            expect(result.length).toBe(1);
            expect(decodersRegistryServiceSpy.decoderOf).toHaveBeenCalled();
            done();
          });
      });
    });
  });
});
