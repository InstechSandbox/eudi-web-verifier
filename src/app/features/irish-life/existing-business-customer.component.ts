/* eslint-disable max-statements */

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WalletLayoutComponent } from '@app/core/layout/wallet-layout/wallet-layout.component';
import {
	CompleteExistingBusinessCaseRequest,
	ExistingBusinessCaseSummary,
	ExistingBusinessValidationSummary,
	IrishLifeCaseService,
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
	selector: 'vc-existing-business-customer',
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
      <div body class="irish-life-theme irish-life-page" *ngIf="!loading; else loadingState">
        <section class="bg-panel irish-life-hero" *ngIf="caseSummary as currentCase">
          <p class="irish-life-eyebrow">Existing Business Claims</p>
          <h1 class="irish-life-display">Confirm your withdrawal request</h1>
          <p>
						Policy number: <strong>{{ currentCase.policyNumber }}</strong>
					</p>
					<p>
            Claim reference: <strong>{{ currentCase.claimReference }}</strong>
          </p>
          <p>
						Your withdrawal request has been received. Irish Life is now asking for PID proof so
						the release decision can be processed automatically.
          </p>
        </section>

        <mat-card class="irish-life-panel" *ngIf="caseSummary as currentCase">
          <mat-card-content>
            <div class="request-summary">
							<div>
								<p class="irish-life-detail-label">Policy number</p>
								<strong>{{ currentCase.policyNumber }}</strong>
							</div>
              <div>
                <p class="irish-life-detail-label">Product</p>
                <strong>{{ currentCase.productName }}</strong>
              </div>
              <div>
                <p class="irish-life-detail-label">Withdrawal amount</p>
                <strong>{{ currentCase.withdrawalAmount }}</strong>
              </div>
              <div>
                <p class="irish-life-detail-label">Destination account</p>
                <strong>Ending {{ currentCase.bankAccountLastFour }}</strong>
              </div>
							<div>
								<p class="irish-life-detail-label">Request status</p>
								<strong>{{ currentCase.currentStatus }}</strong>
							</div>
            </div>

						<div class="request-panel" *ngIf="!proofStepStarted && !processingResult && !isTerminalState(currentCase)">
              <p>
								Preparing your wallet proof request. If it does not appear automatically, refresh
								this page.
							</p>
            </div>

            <div class="proof-shell" *ngIf="proofStepStarted && currentCase.activeTransaction && !concludedTransaction && !isTerminalState(currentCase)">
              <vc-qr-code (transactionConcludedEvent)="handleTransactionConcluded($event)"></vc-qr-code>
            </div>

            <div class="empty-state" *ngIf="!currentCase.activeTransaction && !isTerminalState(currentCase)">
              <p>
								The verifier has not finished preparing the wallet proof request yet. Refresh this
								page in a moment if the proof handoff does not appear.
              </p>
            </div>

            <div class="progress-state" *ngIf="processingResult">
              <mat-spinner diameter="34"></mat-spinner>
              <p>Validating your proof and recording the automated claims outcome.</p>
            </div>

            <div *ngIf="shouldShowTerminalResult(currentCase)">
              <mat-divider></mat-divider>
              <div class="irish-life-result-banner" [class.success]="caseSummary.currentStatus === 'COMPLETED'" [class.failure]="caseSummary.currentStatus === 'FAILED'">
                <strong>{{ resultHeadline }}</strong>
                <p>{{ resultMessage }}</p>
              </div>

              <ul class="validation-list" *ngIf="validationReasons.length > 0">
                <li *ngFor="let reason of validationReasons">{{ reason }}</li>
              </ul>

              <div class="irish-life-evidence-panel" *ngIf="validationDetails.length > 0">
                <p class="irish-life-detail-label">Verifier comparison</p>
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

						<div class="actions-row" *ngIf="caseSummary.currentStatus !== 'FAILED'">
							<a routerLink="/irish-life/existing-business/customer" class="irish-life-ghost-link inline-link">
								Start another withdrawal request
							</a>
						</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <ng-template #loadingState>
        <div body class="loading-block">
          <mat-spinner diameter="36"></mat-spinner>
          <p>Loading Irish Life claim details...</p>
        </div>
      </ng-template>
    </vc-wallet-layout>
  `,
	styles: [
		`
      :host { display: block; }

      .request-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .request-panel,
      .progress-state,
      .loading-block,
      .empty-state {
        display: grid;
        gap: 0.75rem;
        justify-items: center;
        text-align: center;
        padding: 1.5rem 0;
      }

      .request-panel {
        border-radius: 16px;
        background: linear-gradient(180deg, #f1f6fd, var(--irish-life-paper));
        border: 1px solid var(--irish-life-line);
        padding: 1rem;
        justify-items: stretch;
      }

      .actions-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
      }

      .proof-shell { margin-top: 1rem; }
      .validation-list { margin: 0 0 1rem; padding-left: 1.1rem; }
      .evidence-item + .evidence-item { margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px solid rgba(0, 0, 0, 0.08); }
      .evidence-name, .evidence-item p, .evidence-note { margin: 0.2rem 0; }
    `,
	],
})
export class ExistingBusinessCustomerComponent implements OnInit {
	loading = true;
	processingResult = false;
	proofStepStarted = false;
	caseSummary?: ExistingBusinessCaseSummary;
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
			this.resultHeadline = 'Withdrawal request missing';
			this.resultMessage = 'Start from the withdrawal request page and enter a supported policy number.';
			return;
		}

		this.loadCase(caseId);
	}

	startProofStep (): void {
		this.proofStepStarted = true;
	}

	async handleTransactionConcluded (transaction: ConcludedTransaction): Promise<void> {
		this.concludedTransaction = transaction;
		await this.evaluateAndComplete(transaction);
	}

	protected isTerminalState (summary: ExistingBusinessCaseSummary): boolean {
		return summary.currentStatus === 'COMPLETED' || summary.currentStatus === 'FAILED';
	}

	protected shouldShowTerminalResult (summary: ExistingBusinessCaseSummary): boolean {
		return this.isTerminalState(summary) || !!this.concludedTransaction;
	}

	private loadCase (caseId: string): void {
		this.caseService.getExistingBusinessCase(caseId).subscribe({
			next: async (summary) => {
				this.caseSummary = summary;
				this.proofStepStarted = !!summary.activeTransaction && !this.isTerminalState(summary);
				if (summary.activeTransaction) {
					this.localStorageService.set(ACTIVE_TRANSACTION, JSON.stringify(summary.activeTransaction));
				}

				this.applyPersistedOutcome(summary);

				const responseCode = this.activeRoute.snapshot.queryParamMap.get('response_code');
				if (responseCode && summary.activeTransaction) {
					this.proofStepStarted = true;
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
				this.resultHeadline = 'Withdrawal request not found';
				this.resultMessage = 'The requested Irish Life withdrawal request could not be loaded.';
				this.changeDetectorRef.detectChanges();
			},
		});
	}

	private async loadSameDeviceConclusion (transactionId: string, responseCode: string): Promise<ConcludedTransaction | null> {
		if (!this.caseSummary?.activeTransaction) {
			return null;
		}

		try {
			const walletResponse = await firstValueFrom(this.verifierEndpointService.getWalletResponse(transactionId, responseCode));
			this.localStorageService.remove(ACTIVE_TRANSACTION);
			return this.concludeTransaction(walletResponse);
		} catch {
			this.resultHeadline = 'Wallet response unavailable';
			this.resultMessage = 'The wallet response could not be retrieved for this claim.';
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
		const request: CompleteExistingBusinessCaseRequest = {
			transactionId: transaction.transactionId,
			success: this.validationReasons.length === 0,
			reason: this.validationReasons.join(' '),
			validation,
		};

		this.caseService.completeExistingBusinessCase(this.caseSummary.caseId, request).subscribe({
			next: (summary) => {
				this.caseSummary = summary;
				this.processingResult = false;
				this.applyPersistedOutcome(summary);
				this.changeDetectorRef.detectChanges();
			},
			error: () => {
				this.processingResult = false;
				this.resultHeadline = 'Claim update failed';
				this.resultMessage = 'The verifier could not store the final claim outcome.';
				this.changeDetectorRef.detectChanges();
			},
		});
	}

	private async validateTransaction (transaction: ConcludedTransaction): Promise<ExistingBusinessValidationSummary> {
		const queryId = transaction.presentationQuery.credentials[0]?.id;
		const token = queryId ? transaction.walletResponse.vp_token[queryId]?.[0] : undefined;

		if (!token || !this.caseSummary) {
			this.validationReasons = ['No PID proof was returned by the wallet.'];
			return { reason: this.validationReasons.join(' ') };
		}

		try {
			const payload = await firstValueFrom(this.verifierEndpointService.validateSdJwtVc(token, transaction.nonce));
			const validation = buildIrishLifePidValidation(this.caseSummary, payload);
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

	private applyPersistedOutcome (summary: ExistingBusinessCaseSummary): void {
		this.validationReasons = buildFailureReasons(summary);
		this.validationDetails = buildValidationDetails(summary);
		this.disclosedClaimPaths = disclosedClaimPathsFromSummary(summary);

		if (summary.currentStatus === 'COMPLETED') {
			this.resultHeadline = 'Withdrawal checks completed';
			this.resultMessage = 'Irish Life has verified your PID and released the automated claims decision.';
			return;
		}

		if (summary.currentStatus === 'FAILED') {
			this.resultHeadline = 'Withdrawal proof could not be accepted';
			this.resultMessage = summary.failureReason || 'The presented PID did not satisfy the claim checks.';
			return;
		}

		this.resultHeadline = '';
		this.resultMessage = '';
	}
}