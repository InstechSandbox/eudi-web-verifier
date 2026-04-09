import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map, retry, tap} from 'rxjs/operators';
import {HttpService} from '@network/http/http.service';
import {LocalStorageService} from './local-storage.service';
import * as constants from '@core/constants/general';
import {DeviceDetectorService} from './device-detector.service';
import {TransactionInitializationRequest} from "@core/models/TransactionInitializationRequest";
import {InitializedTransaction} from "@core/models/InitializedTransaction";
import {WalletResponse} from "@core/models/WalletResponse";
import {EventLog} from "@core/models/EventLog";
import { HttpHeaders } from "@angular/common/http";
import {ActiveTransaction} from "@core/models/ActiveTransaction";
import { SessionStorageService } from './session-storage.service';

const SAME_DEVICE_UI_RE_ENTRY_URL = '/get-wallet-code?response_code={RESPONSE_CODE}';
const INIT_TRANSACTION_ENDPOINT = 'ui/presentations';
const WALLET_RESPONSE_ENDPOINT = 'ui/presentations/${transactionId}';
const EVENTS_ENDPOINT = 'ui/presentations/${transactionId}/events';
const VALIDATE_SD_JWT_VC_PRESENTATION_ENDPOINT = 'utilities/validations/sdJwtVc';

@Injectable()
export class VerifierEndpointService {

  constructor(
    private readonly httpService: HttpService,
    private readonly localStorageService: LocalStorageService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly deviceDetectorService: DeviceDetectorService,
  ) {
  }

  initializeTransaction(initializationRequest: TransactionInitializationRequest, callback: (value: InitializedTransaction) => void) {
    if (initializationRequest) {
      const payload: any = {...initializationRequest};
      if (!this.deviceDetectorService.isDesktop()) {
        payload['wallet_response_redirect_uri_template'] = location.origin + SAME_DEVICE_UI_RE_ENTRY_URL;
      }
      this.httpService.post<InitializedTransaction, string>(INIT_TRANSACTION_ENDPOINT, payload)
        .pipe(
          map((res) => this.withAuthorizationRequestUri(res, `${initializationRequest.authorization_request_scheme}://`)),
          tap((res) => {
            let activeTransaction : ActiveTransaction = {
              initialized_transaction: res,
              initialization_request: initializationRequest
            }
            this.localStorageService.set(constants.ACTIVE_TRANSACTION, JSON.stringify(activeTransaction));
          })
        ).subscribe({
          next: callback,
          error: (error) => {
            console.error('Failed to initialize verifier transaction', error);
          }
        });
    }
  }

  private withAuthorizationRequestUri(
    response: InitializedTransaction,
    walletUriScheme: string,
  ): InitializedTransaction {
    if (response.authorization_request_uri) {
      return response;
    }

    const authority = this.authorizationRequestAuthority(response);
    const query = new URLSearchParams();
    query.set('client_id', response.client_id);
    query.set('response_type', 'vp_token');
    if (response.request) {
      query.set('request', response.request);
    }
    if (response.request_uri) {
      query.set('request_uri', response.request_uri);
    }
    if (response.request_uri_method) {
      query.set('request_uri_method', response.request_uri_method);
    }

    const base = `${walletUriScheme}${authority}`;
    const separator = base.includes('?') ? '&' : '?';
    return {
      ...response,
      authorization_request_uri: `${base}${separator}${query.toString()}`
    };
  }

  private authorizationRequestAuthority(response: InitializedTransaction): string {
    const requestUriAuthority = this.uriAuthority(response.request_uri);
    if (requestUriAuthority) {
      return requestUriAuthority;
    }

    const clientIdAuthority = this.uriAuthority(response.client_id);
    if (clientIdAuthority) {
      return clientIdAuthority;
    }

    if (response.client_id && !response.client_id.includes('/')) {
      return response.client_id;
    }

    return 'localhost';
  }

  private uriAuthority(value?: string): string | null {
    if (!value) {
      return null;
    }

    try {
      const parsed = new URL(value);
      return parsed.host || null;
    } catch {
      return null;
    }
  }

  getWalletResponse(transaction_id: string, code?: string): Observable<WalletResponse> {
    if (typeof code == 'undefined') {
      return this.httpService.get(WALLET_RESPONSE_ENDPOINT.replace('${transactionId}', transaction_id));
    } else {
      return this.httpService.get(WALLET_RESPONSE_ENDPOINT.replace('${transactionId}', transaction_id) + `?response_code=${code}`);
    }
  }

  getsTransactionEventsLogs(transactionId: string): Observable<EventLog[]> {
    return this.httpService.get(EVENTS_ENDPOINT.replace('${transactionId}', transactionId))
      .pipe(
        map((data: any) => {
          return data.events.map((event: EventLog) => {
            let data = { };
            this.getTransactionData(event)
              .forEach((key: string) => {
                const value = event[key as keyof EventLog];
                data = { ...data, [key]: value}
              });
            event.data = data;
            return event;
          });
        })
      );
  }

  validateSdJwtVc(payload: string, nonce: string): Observable<any> {
    const issuerChain = this.sessionStorageService.get(constants.ISSUER_CHAIN) ?? undefined;

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    // Convert object to form data string
    const body = new URLSearchParams();
    body.set('sd_jwt_vc', payload);
    body.set('nonce', nonce);
    issuerChain && body.set('issuer_chain', issuerChain);

    return this.httpService.post<any, string>(VALIDATE_SD_JWT_VC_PRESENTATION_ENDPOINT, body.toString(), {headers})
  }

  private getTransactionData(event: EventLog): string[] {
    const objKeys = Object.keys(event);
    objKeys.splice(objKeys.indexOf('timestamp'), 1);
    objKeys.splice(objKeys.indexOf('event'), 1);
    objKeys.splice(objKeys.indexOf('actor'), 1);
    return objKeys;
  }
}
