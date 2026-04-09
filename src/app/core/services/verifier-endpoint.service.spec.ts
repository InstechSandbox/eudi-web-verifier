import { TestBed } from '@angular/core/testing';

import { VerifierEndpointService } from './verifier-endpoint.service';
import { HttpService } from '@network/http/http.service';
import { InitializedTransaction } from '../models/InitializedTransaction';
import { TransactionInitializationRequest } from '../models/TransactionInitializationRequest';
import { of } from 'rxjs';

const mockResponseData: InitializedTransaction = {
  client_id: 'client_id',
  request_uri: 'request_uri',
  request_uri_method: 'get',
  transaction_id: 'transaction_id',
  authorization_request_uri: 'eudi-openid4vp://client_id?client_id=client_id&response_type=vp_token&request_uri=request_uri&request_uri_method=get',
};

describe('VerifierEndpointService', () => {
  let service: VerifierEndpointService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpService', ['post']);
    TestBed.configureTestingModule({
      providers: [
        VerifierEndpointService,
        { provide: HttpService, useValue: spy },
      ],
    });
    service = TestBed.inject(VerifierEndpointService);
    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize transaction', () => {
    httpServiceSpy.post.and.returnValue(of(mockResponseData));
    service.initializeTransaction({} as TransactionInitializationRequest, () => {});
    expect(httpServiceSpy.post).toHaveBeenCalled();
  });

  it('should add response_type when rebuilding authorization_request_uri fallback', () => {
    const callback = jasmine.createSpy('callback');
    httpServiceSpy.post.and.returnValue(of({
      client_id: 'Verifier',
      request_uri: 'https://verifier.example/wallet/request.jwt/token',
      request_uri_method: 'get',
      transaction_id: 'transaction_id',
    } as InitializedTransaction));

    service.initializeTransaction({
      authorization_request_scheme: 'eudi-openid4vp',
    } as TransactionInitializationRequest, callback);

    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
      authorization_request_uri: 'eudi-openid4vp://verifier.example?client_id=Verifier&response_type=vp_token&request_uri=https%3A%2F%2Fverifier.example%2Fwallet%2Frequest.jwt%2Ftoken&request_uri_method=get'
    }));
  });

});
