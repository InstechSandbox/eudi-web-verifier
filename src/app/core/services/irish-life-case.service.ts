import { Injectable } from '@angular/core';
import { HttpService } from '@core/network/http/http.service';
import { Observable } from 'rxjs';
import { ActiveTransaction } from '@core/models/ActiveTransaction';

const BASE_ENDPOINT = 'ui/irish-life/new-business/cases';

export type NewBusinessCaseStatusCode =
  | 'POLICY_SETUP'
  | 'AML_TRIGGERED'
  | 'INVITE_SENT'
  | 'PROOFS_RECEIVED'
  | 'PROOFS_VERIFIED'
  | 'PROOFS_MATCHED'
  | 'AML_STATUS_LOGGED'
  | 'CUSTOMER_NOTIFIED'
  | 'COMPLETED'
  | 'FAILED';

export type NewBusinessCaseStatus = {
  code: NewBusinessCaseStatusCode;
  label: string;
  at: string;
};

export type NewBusinessClaimsSnapshot = {
  givenName?: unknown;
  familyName?: unknown;
  birthDate?: unknown;
  address?: unknown;
  expiry?: unknown;
  disclosedClaimPaths?: unknown;
};

export type NewBusinessValidationSummary = {
  matchedGivenName?: boolean;
  matchedFamilyName?: boolean;
  matchedBirthDate?: boolean;
  matchedAddress?: boolean;
  credentialExpired?: boolean;
  credentialExpiry?: string;
  reason?: string;
  claimsSnapshot?: NewBusinessClaimsSnapshot;
};

export type NewBusinessCaseSummary = {
  caseId: string;
  policyReference: string;
  customerGivenName: string;
  customerFamilyName: string;
  customerEmail: string;
  customerBirthDate: string;
  customerAddress: string;
  currentStatus: NewBusinessCaseStatusCode;
  statuses: NewBusinessCaseStatus[];
  customerPortalUrl: string;
  walletDeepLink?: string;
  activeTransaction?: ActiveTransaction;
  inviteEmailSent: boolean;
  completionEmailSent: boolean;
  failureReason?: string;
  validation?: NewBusinessValidationSummary;
};

export type CreateNewBusinessCaseRequest = {
  policyReference?: string;
  customerGivenName: string;
  customerFamilyName: string;
  customerEmail: string;
  customerBirthDate: string;
  customerAddress: string;
};

export type CompleteNewBusinessCaseRequest = {
  transactionId?: string;
  success: boolean;
  reason?: string;
  validation?: NewBusinessValidationSummary;
};

@Injectable({
	providedIn: 'root',
})
export class IrishLifeCaseService {
	constructor (private readonly httpService: HttpService) {}

	createCase (
		request: CreateNewBusinessCaseRequest
	): Observable<NewBusinessCaseSummary> {
		return this.httpService.post<NewBusinessCaseSummary, CreateNewBusinessCaseRequest>(
			BASE_ENDPOINT,
			request
		);
	}

	inviteCase (caseId: string): Observable<NewBusinessCaseSummary> {
		return this.httpService.post<NewBusinessCaseSummary, Record<string, never>>(
			`${BASE_ENDPOINT}/${caseId}/invite`,
			{}
		);
	}

	getCase (caseId: string): Observable<NewBusinessCaseSummary> {
		return this.httpService.get<NewBusinessCaseSummary>(`${BASE_ENDPOINT}/${caseId}`);
	}

	completeCase (
		caseId: string,
		request: CompleteNewBusinessCaseRequest
	): Observable<NewBusinessCaseSummary> {
		return this.httpService.post<NewBusinessCaseSummary, CompleteNewBusinessCaseRequest>(
			`${BASE_ENDPOINT}/${caseId}/complete`,
			request
		);
	}
}