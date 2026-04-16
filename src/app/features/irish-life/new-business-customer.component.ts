/* eslint-disable max-statements */

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WalletLayoutComponent } from '@app/core/layout/wallet-layout/wallet-layout.component';
import {
	CompleteNewBusinessCaseRequest,
	IrishLifeCaseService,
	NewBusinessCaseSummary,
	NewBusinessValidationSummary,
} from '@core/services/irish-life-case.service';
import { LocalStorageService } from '@core/services/local-storage.service';
import { ACTIVE_TRANSACTION } from '@core/constants/general';
import { ConcludedTransaction } from '@core/models/ConcludedTransaction';
import { QrCodeComponent } from '@features/invoke-wallet/components/qr-code/qr-code.component';
import { PresentationsResultsComponent } from '@features/invoke-wallet/components/presentations-results/presentations-results.component';
import { VerifierEndpointService } from '@core/services/verifier-endpoint.service';
import { firstValueFrom } from 'rxjs';
import { WalletResponse } from '@core/models/WalletResponse';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
	buildFailureReasons,
	buildValidationDetails,
	disclosedClaimPathsFromSummary,
	ValidationDetail,
} from './new-business-validation-details';
import {
	buildIrishLifePidValidation,
	collectIrishLifePidValidationReasons,
} from './irish-life-pid-validation';

@Component({
	selector: 'vc-new-business-customer',
	standalone: true,
	imports: [
		CommonModule,
		RouterLink,
		WalletLayoutComponent,
		QrCodeComponent,
		PresentationsResultsComponent,
		MatButtonModule,
		MatCardModule,
		MatDividerModule,
		MatProgressSpinnerModule,
	],
	providers: [VerifierEndpointService],
	template: `
    <vc-wallet-layout>
			<div body class="page irish-life-theme irish-life-page" *ngIf="!loading; else loadingState">
				<section class="hero bg-panel irish-life-hero" *ngIf="caseSummary as currentCase">
					<p class="eyebrow irish-life-eyebrow">Customer proof page</p>
					<h1 class="irish-life-display">Share your identity proof for Irish Life</h1>
          <p>
            Case reference: <strong>{{ currentCase.policyReference }}</strong>
          </p>
          <p>
            We will ask for your PID so Irish Life can confirm your name, date of birth,
            address, and credential validity.
          </p>
        </section>

				<mat-card class="panel irish-life-panel" *ngIf="caseSummary as currentCase">
          <mat-card-content>
			<p class="detail-label irish-life-detail-label">Current status</p>
			<h2 class="irish-life-heading">{{ currentCase.currentStatus }}</h2>
			<p *ngIf="shouldShowInlineFailureReason(currentCase)" class="error">{{ currentCase.failureReason }}</p>

            <div class="actions-row" *ngIf="!concludedTransaction && currentCase.activeTransaction && !isTerminalState(currentCase)">
							<a routerLink="/irish-life/new-business/customer" class="ghost-link irish-life-ghost-link inline-link">
                Use another case reference
              </a>
            </div>

            <div class="proof-shell" *ngIf="currentCase.activeTransaction && !concludedTransaction && !isTerminalState(currentCase)">
              <vc-qr-code (transactionConcludedEvent)="handleTransactionConcluded($event)"></vc-qr-code>
            </div>

            <div class="empty-state" *ngIf="!currentCase.activeTransaction && !isTerminalState(currentCase)">
              <p>
                This case has not been invited yet. Return to the support agent or wait for the
                invitation email to be sent.
              </p>
            </div>

            <div class="progress-state" *ngIf="processingResult">
              <mat-spinner diameter="34"></mat-spinner>
              <p>Validating your proof and updating the case outcome.</p>
            </div>

            <div *ngIf="shouldShowTerminalResult(currentCase)">
              <mat-divider></mat-divider>
							<div class="result-banner irish-life-result-banner" [class.success]="caseSummary.currentStatus === 'COMPLETED'" [class.failure]="caseSummary.currentStatus === 'FAILED'">
                <strong>{{ resultHeadline }}</strong>
                <p>{{ resultMessage }}</p>
              </div>

              <ul class="validation-list" *ngIf="validationReasons.length > 0">
                <li *ngFor="let reason of validationReasons">{{ reason }}</li>
              </ul>

							<div class="evidence-panel irish-life-evidence-panel" *ngIf="validationDetails.length > 0">
								<p class="detail-label irish-life-detail-label">Verifier comparison</p>
                <div class="evidence-item" *ngFor="let detail of validationDetails">
                  <p class="evidence-name">{{ detail.label }}</p>
                  <p><strong>Application:</strong> {{ detail.expected }}</p>
                  <p><strong>Wallet:</strong> {{ detail.actual }}</p>
                </div>
                <p class="evidence-note" *ngIf="disclosedClaimPaths.length > 0">
                  Disclosed claim paths: {{ disclosedClaimPaths.join(', ') }}
                </p>
              </div>

              <vc-presentations-results *ngIf="concludedTransaction" [concludedTransaction]="concludedTransaction"></vc-presentations-results>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <ng-template #loadingState>
        <div body class="loading-block">
          <mat-spinner diameter="36"></mat-spinner>
          <p>Loading Irish Life case details...</p>
        </div>
      </ng-template>
    </vc-wallet-layout>
  `,
	styles: [
		`
			:host { display: block; }

      .proof-shell {
        margin-top: 1rem;
      }

      .progress-state,
      .loading-block,
      .empty-state {
        display: grid;
        gap: 0.75rem;
        justify-items: center;
        text-align: center;
        padding: 1.5rem 0;
      }

      .validation-list {
        margin: 0 0 1rem;
        padding-left: 1.1rem;
      }

			.evidence-panel { margin-bottom: 1rem; }

      .evidence-item + .evidence-item {
        margin-top: 0.85rem;
        padding-top: 0.85rem;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
      }

      .evidence-name {
        margin: 0 0 0.35rem;
        font-weight: 700;
      }

      .evidence-item p,
      .evidence-note {
        margin: 0.2rem 0;
      }

      .evidence-note {
        margin-top: 0.85rem;
				color: #52617f;
      }

      .error {
        color: #b42318;
      }
    `,
	],
})
export class NewBusinessCustomerComponent implements OnInit {
	loading = true;
	processingResult = false;
	caseSummary?: NewBusinessCaseSummary;
	concludedTransaction?: ConcludedTransaction;
	resultHeadline = '';
	resultMessage = '';
	validationReasons: string[] = [];
	validationDetails: ValidationDetail[] = [];
	disclosedClaimPaths: string[] = [];

	constructor (
    private readonly activeRoute: ActivatedRoute,
    private readonly caseService: IrishLifeCaseService,
    private readonly localStorageService: LocalStorageService,
    private readonly verifierEndpointService: VerifierEndpointService,
    private readonly changeDetectorRef: ChangeDetectorRef
	) {}

	ngOnInit (): void {
		const caseId = this.activeRoute.snapshot.paramMap.get('caseId');
		if (!caseId) {
			this.loading = false;
			this.resultHeadline = 'Case reference missing';
			this.resultMessage = 'No customer case reference was provided.';
			return;
		}

		this.loadCase(caseId);
	}

	async handleTransactionConcluded (transaction: ConcludedTransaction): Promise<void> {
		this.concludedTransaction = transaction;
		await this.evaluateAndComplete(transaction);
	}

	private loadCase (caseId: string): void {
		this.caseService.getCase(caseId).subscribe({
			next: async (summary) => {
				this.caseSummary = summary;
				if (summary.activeTransaction) {
					this.localStorageService.set(ACTIVE_TRANSACTION, JSON.stringify(summary.activeTransaction));
				}

				this.applyPersistedOutcome(summary);

				const responseCode = this.activeRoute.snapshot.queryParamMap.get('response_code');
				if (responseCode && summary.activeTransaction) {
					const transaction = await this.loadSameDeviceConclusion(
						summary.activeTransaction.initialized_transaction.transaction_id,
						responseCode
					);
					if (transaction) {
						this.concludedTransaction = transaction;
						await this.evaluateAndComplete(transaction);
					}
				}

				this.loading = false;
				this.changeDetectorRef.detectChanges();
			},
			error: () => {
				this.loading = false;
				this.resultHeadline = 'Case not found';
				this.resultMessage = 'The requested Irish Life case could not be loaded.';
				this.changeDetectorRef.detectChanges();
			},
		});
	}

	private async loadSameDeviceConclusion (
		transactionId: string,
		responseCode: string
	): Promise<ConcludedTransaction | null> {
		if (!this.caseSummary?.activeTransaction) {
			return null;
		}

		try {
			const walletResponse = await firstValueFrom(
				this.verifierEndpointService.getWalletResponse(transactionId, responseCode)
			);
			this.localStorageService.remove(ACTIVE_TRANSACTION);
			return this.concludeTransaction(walletResponse);
		} catch {
			this.resultHeadline = 'Wallet response unavailable';
			this.resultMessage = 'The wallet response could not be retrieved for this case.';
			this.changeDetectorRef.detectChanges();
			return null;
		}
	}

	private concludeTransaction (walletResponse: WalletResponse): ConcludedTransaction {
		const activeTransaction = this.caseSummary!.activeTransaction!;
		return {
			transactionId: activeTransaction.initialized_transaction.transaction_id,
			presentationQuery: activeTransaction.initialization_request.dcql_query,
			walletResponse,
			nonce: activeTransaction.initialization_request.nonce,
		};
	}

	private async evaluateAndComplete (transaction: ConcludedTransaction): Promise<void> {
		if (!this.caseSummary) {
			return;
		}

		this.processingResult = true;
		this.validationReasons = [];

		const validation = await this.validateTransaction(transaction);
		const request: CompleteNewBusinessCaseRequest = {
			transactionId: transaction.transactionId,
			success: this.validationReasons.length === 0,
			reason: this.validationReasons.join(' '),
			validation,
		};

		this.caseService.completeCase(this.caseSummary.caseId, request).subscribe({
			next: (summary) => {
				this.caseSummary = summary;
				this.processingResult = false;
				this.applyPersistedOutcome(summary);
				this.changeDetectorRef.detectChanges();
			},
			error: () => {
				this.processingResult = false;
				this.resultHeadline = 'Case update failed';
				this.resultMessage = 'The verifier could not store the final case outcome.';
				this.changeDetectorRef.detectChanges();
			},
		});
	}

	private async validateTransaction (
		transaction: ConcludedTransaction
	): Promise<NewBusinessValidationSummary> {
		const queryId = transaction.presentationQuery.credentials[0]?.id;
		const token = queryId ? transaction.walletResponse.vp_token[queryId]?.[0] : undefined;

		if (!token || !this.caseSummary) {
			this.validationReasons = ['No PID proof was returned by the wallet.'];
			return { reason: this.validationReasons.join(' ') };
		}

		try {
			const payload = await firstValueFrom(
				this.verifierEndpointService.validateSdJwtVc(token, transaction.nonce)
			);

			const validation: NewBusinessValidationSummary = buildIrishLifePidValidation(this.caseSummary, payload);
			this.validationReasons = collectIrishLifePidValidationReasons(validation);
			return validation;
		} catch (error: any) {
			const backendReason = typeof error?.error === 'string' ? error.error : 'The PID could not be validated.';
			this.validationReasons = [backendReason];
			return {
				credentialExpired: true,
				reason: backendReason,
			};
		}
	}

	protected isTerminalState (summary: NewBusinessCaseSummary): boolean {
		return summary.currentStatus === 'COMPLETED' || summary.currentStatus === 'FAILED';
	}

	protected shouldShowTerminalResult (summary: NewBusinessCaseSummary): boolean {
		return this.isTerminalState(summary) || !!this.concludedTransaction;
	}

	protected shouldShowInlineFailureReason (summary: NewBusinessCaseSummary): boolean {
		if (!summary.failureReason) {
			return false;
		}

		return !this.isTerminalState(summary) ||
			(this.validationReasons.length === 0 && this.validationDetails.length === 0);
	}

	private applyPersistedOutcome (summary: NewBusinessCaseSummary): void {
		this.validationDetails = buildValidationDetails(summary);
		this.disclosedClaimPaths = disclosedClaimPathsFromSummary(summary);

		if (summary.currentStatus === 'COMPLETED') {
			this.applyCompletedOutcome(summary);
			return;
		}

		if (summary.currentStatus === 'FAILED') {
			this.applyFailedOutcome(summary);
			return;
		}

		this.validationReasons = [];
	}

	private applyCompletedOutcome (summary: NewBusinessCaseSummary): void {
		this.resultHeadline = 'Proof accepted';
		this.resultMessage = summary.completionEmailSent ?
			'Your proof has been accepted and a completion email has been sent.' :
			'Your proof has been accepted. The backend did not report a completion email as sent.';
		this.validationReasons = [];
	}

	private applyFailedOutcome (summary: NewBusinessCaseSummary): void {
		this.resultHeadline = 'Proof failed';
		this.validationReasons = buildFailureReasons(summary);
		this.resultMessage = this.validationReasons.some((reason) => reason.includes('was not disclosed by the wallet')) ?
			'The PID was presented, but one or more required details were not disclosed by the wallet.' :
			this.validationDetails.length > 0 ?
				'The proof did not match the application details shown below.' :
				summary.failureReason || 'The proof could not be validated for this case.';
	}
}