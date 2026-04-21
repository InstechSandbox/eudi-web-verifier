import { Injectable } from '@angular/core';
import { HttpService } from '@core/network/http/http.service';
import { Observable } from 'rxjs';
import { ActiveTransaction } from '@core/models/ActiveTransaction';

const NEW_BUSINESS_BASE_ENDPOINT = 'ui/irish-life/new-business/cases';
const EXISTING_BUSINESS_BASE_ENDPOINT = 'ui/irish-life/existing-business/cases';

export type IrishLifeCasePartyDetails = {
  customerGivenName: string;
  customerFamilyName: string;
  customerEmail: string;
  customerBirthDate: string;
  customerAddress: string;
};

export type IrishLifeClaimsSnapshot = {
  givenName?: unknown;
  familyName?: unknown;
  birthDate?: unknown;
  address?: unknown;
  expiry?: unknown;
  disclosedClaimPaths?: unknown;
};

export type IrishLifeValidationSummary = {
  matchedGivenName?: boolean;
  matchedFamilyName?: boolean;
  matchedBirthDate?: boolean;
  matchedAddress?: boolean;
  credentialExpired?: boolean;
  credentialExpiry?: string;
  reason?: string;
  claimsSnapshot?: IrishLifeClaimsSnapshot;
};

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

export type NewBusinessClaimsSnapshot = IrishLifeClaimsSnapshot;

export type NewBusinessValidationSummary = IrishLifeValidationSummary;

export type NewBusinessCaseSummary = IrishLifeCasePartyDetails & {
  caseId: string;
  policyReference: string;
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
} & IrishLifeCasePartyDetails;

export type CompleteNewBusinessCaseRequest = {
  transactionId?: string;
  success: boolean;
  reason?: string;
  validation?: NewBusinessValidationSummary;
};

export type ExistingBusinessCaseStatusCode =
  | 'WITHDRAWAL_REQUEST_RECEIVED'
  | 'AUTOMATED_CHECKS_STARTED'
  | 'PROOF_INVITE_SENT'
  | 'PROOFS_RECEIVED'
  | 'PROOFS_VERIFIED'
  | 'POLICY_APPLICATION_MATCHED'
  | 'AML_RECORD_NOT_FOUND'
  | 'AUTOMATED_DECISION_RECORDED'
  | 'CUSTOMER_NOTIFIED'
  | 'COMPLETED'
  | 'FAILED';

export type ExistingBusinessCaseStatus = {
  code: ExistingBusinessCaseStatusCode;
  label: string;
  at: string;
};

export type ExistingBusinessNotificationCode =
  | 'WITHDRAWAL_REQUEST_ALERT'
  | 'AUTOMATED_CHECKS_STARTED_ALERT'
  | 'PROOF_REQUESTED_ALERT'
  | 'PROOFS_SUBMITTED_ALERT'
  | 'PROOFS_READY_ALERT'
  | 'AML_CHECK_COMPLETED_ALERT'
  | 'DECISION_READY_ALERT'
  | 'MANUAL_REVIEW_ALERT';

export type ExistingBusinessNotification = {
  code: ExistingBusinessNotificationCode;
  label: string;
  message: string;
  at: string;
};

export type ExistingBusinessValidationSummary = IrishLifeValidationSummary;

export type ExistingBusinessCaseSummary = IrishLifeCasePartyDetails & {
  caseId: string;
  policyNumber: string;
  claimReference: string;
  productName: string;
  withdrawalAmount: string;
  bankAccountLastFour: string;
  requestedAt: string;
  currentStatus: ExistingBusinessCaseStatusCode;
  statuses: ExistingBusinessCaseStatus[];
  notifications: ExistingBusinessNotification[];
  customerPortalUrl: string;
  walletDeepLink?: string;
  activeTransaction?: ActiveTransaction;
  inviteEmailSent: boolean;
  completionEmailSent: boolean;
  amlRecordFound: boolean;
  policyApplicationMatched: boolean;
  automatedDecision?: string;
  failureReason?: string;
  validation?: ExistingBusinessValidationSummary;
};

export type CreateExistingBusinessCaseRequest = {
  policyNumber: string;
};

export type CompleteExistingBusinessCaseRequest = {
  transactionId?: string;
  success: boolean;
  reason?: string;
  validation?: ExistingBusinessValidationSummary;
};

const FALLBACK_STATUS_LABELS: Record<string, string> = {
  POLICY_SETUP: 'Case created',
  AML_TRIGGERED: 'Checks started',
  INVITE_SENT: 'Invitation sent',
  PROOFS_RECEIVED: 'Proof received',
  PROOFS_VERIFIED: 'Proof checked',
  PROOFS_MATCHED: 'Details matched',
  AML_STATUS_LOGGED: 'Checks logged',
  CUSTOMER_NOTIFIED: 'Customer updated',
  COMPLETED: 'Completed',
  FAILED: 'Needs attention',
  WITHDRAWAL_REQUEST_RECEIVED: 'Withdrawal request received',
  AUTOMATED_CHECKS_STARTED: 'Checks started',
  PROOF_INVITE_SENT: 'Wallet request sent',
  POLICY_APPLICATION_MATCHED: 'Details matched',
  AML_RECORD_NOT_FOUND: 'Checks completed',
  AUTOMATED_DECISION_RECORDED: 'Decision recorded',
};

function resolveStatusLabel<T extends { code: string; label: string }> (currentStatus: string, statuses: T[]): string {
  const matchingStatus = [...statuses].reverse().find((status) => status.code === currentStatus);
  return matchingStatus?.label ?? FALLBACK_STATUS_LABELS[currentStatus] ?? currentStatus.replace(/_/g, ' ').toLowerCase();
}

export function getNewBusinessCurrentStatusLabel (summary: NewBusinessCaseSummary): string {
  return resolveStatusLabel(summary.currentStatus, summary.statuses);
}

export function getExistingBusinessCurrentStatusLabel (summary: ExistingBusinessCaseSummary): string {
  return resolveStatusLabel(summary.currentStatus, summary.statuses);
}

@Injectable({
	providedIn: 'root',
})
export class IrishLifeCaseService {
	constructor (private readonly httpService: HttpService) {}

	createCase (
		request: CreateNewBusinessCaseRequest
	): Observable<NewBusinessCaseSummary> {
		return this.httpService.post<NewBusinessCaseSummary, CreateNewBusinessCaseRequest>(
			NEW_BUSINESS_BASE_ENDPOINT,
			request
		);
	}

	inviteCase (caseId: string): Observable<NewBusinessCaseSummary> {
		return this.httpService.post<NewBusinessCaseSummary, Record<string, never>>(
			`${NEW_BUSINESS_BASE_ENDPOINT}/${caseId}/invite`,
			{}
		);
	}

	getCase (caseId: string): Observable<NewBusinessCaseSummary> {
		return this.httpService.get<NewBusinessCaseSummary>(`${NEW_BUSINESS_BASE_ENDPOINT}/${caseId}`);
	}

	completeCase (
		caseId: string,
		request: CompleteNewBusinessCaseRequest
	): Observable<NewBusinessCaseSummary> {
		return this.httpService.post<NewBusinessCaseSummary, CompleteNewBusinessCaseRequest>(
			`${NEW_BUSINESS_BASE_ENDPOINT}/${caseId}/complete`,
			request
		);
	}

	createExistingBusinessCase (
		request: CreateExistingBusinessCaseRequest
	): Observable<ExistingBusinessCaseSummary> {
		return this.httpService.post<ExistingBusinessCaseSummary, CreateExistingBusinessCaseRequest>(
			EXISTING_BUSINESS_BASE_ENDPOINT,
			request
		);
	}

	inviteExistingBusinessCase (caseId: string): Observable<ExistingBusinessCaseSummary> {
		return this.httpService.post<ExistingBusinessCaseSummary, Record<string, never>>(
			`${EXISTING_BUSINESS_BASE_ENDPOINT}/${caseId}/invite`,
			{}
		);
	}

	getExistingBusinessCase (caseId: string): Observable<ExistingBusinessCaseSummary> {
		return this.httpService.get<ExistingBusinessCaseSummary>(`${EXISTING_BUSINESS_BASE_ENDPOINT}/${caseId}`);
	}

  listExistingBusinessCases (): Observable<ExistingBusinessCaseSummary[]> {
    return this.httpService.get<ExistingBusinessCaseSummary[]>(EXISTING_BUSINESS_BASE_ENDPOINT);
  }

	completeExistingBusinessCase (
		caseId: string,
		request: CompleteExistingBusinessCaseRequest
	): Observable<ExistingBusinessCaseSummary> {
		return this.httpService.post<ExistingBusinessCaseSummary, CompleteExistingBusinessCaseRequest>(
			`${EXISTING_BUSINESS_BASE_ENDPOINT}/${caseId}/complete`,
			request
		);
	}
}