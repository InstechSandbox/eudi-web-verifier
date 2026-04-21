/* eslint-disable max-statements */

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WalletLayoutComponent } from '@app/core/layout/wallet-layout/wallet-layout.component';
import {
	CompleteExistingBusinessCaseRequest,
	ExistingBusinessCaseSummary,
	getExistingBusinessCurrentStatusLabel,
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
	hasOnlyNonBlockingFailure,
	ValidationDetail,
} from './new-business-validation-details';
import {
	buildIrishLifePidValidation,
	collectIrishLifePidValidationReasons,
} from './irish-life-pid-validation';
import { timeout } from 'rxjs/operators';

const SUPPORTED_DEMO_POLICY_NUMBER = '12345678';

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
					<p class="irish-life-eyebrow">Existing Business</p>
					<h1 class="irish-life-display">Withdrawal request</h1>
					<p>
						Request reference: <strong>{{ currentCase.claimReference }}</strong>
          </p>
          <p>
					The request is related to the following policy. Emerald Insurance needs your proof of
					identity/address so the request can be checked automatically.
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
							<p class="irish-life-detail-label">Requested amount</p>
                <strong>{{ currentCase.withdrawalAmount }}</strong>
              </div>
              <div>
                <p class="irish-life-detail-label">Destination account</p>
                <strong>Ending {{ currentCase.bankAccountLastFour }}</strong>
              </div>
							<div>
								<p class="irish-life-detail-label">Request status</p>
								<strong>{{ currentStatusLabel(currentCase) }}</strong>
							</div>
            </div>

						<div class="request-panel" *ngIf="!proofStepStarted && !processingResult && !isTerminalState(currentCase)">
              <p>
							Getting your secure share request ready. If it does not appear automatically,
							refresh this page.
							</p>
            </div>

            <div class="proof-shell" *ngIf="proofStepStarted && currentCase.activeTransaction && !concludedTransaction && !isTerminalState(currentCase)">
              <vc-qr-code (transactionConcludedEvent)="handleTransactionConcluded($event)"></vc-qr-code>
            </div>

            <div class="empty-state" *ngIf="!currentCase.activeTransaction && !isTerminalState(currentCase)">
              <p>
							The wallet request is still being prepared. Refresh this page in a moment if the
							share options do not appear.
              </p>
            </div>

            <div class="progress-state" *ngIf="processingResult">
              <mat-spinner diameter="34"></mat-spinner>
							<p>Checking your proof and updating the request.</p>
            </div>

            <div *ngIf="shouldShowTerminalResult(currentCase)">
              <mat-divider></mat-divider>
			  <div class="irish-life-result-banner" [class.success]="isDisplaySuccessful(caseSummary)" [class.failure]="!isDisplaySuccessful(caseSummary) && caseSummary.currentStatus === 'FAILED'">
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
              </div>

              <vc-presentations-results *ngIf="concludedTransaction" [concludedTransaction]="concludedTransaction"></vc-presentations-results>

						<div class="actions-row" *ngIf="caseSummary.currentStatus !== 'FAILED'">
							<a routerLink="/irish-life/existing-business/customer" class="irish-life-ghost-link inline-link">
								Review another policy
							</a>
						</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <ng-template #loadingState>
        <div body class="loading-block">
          <mat-spinner diameter="36"></mat-spinner>
						<p>Loading your Emerald Insurance policy details...</p>
        </div>
      </ng-template>
    </vc-wallet-layout>
  `,
	styles: [
		`
      :host { display: block; }

      .request-summary {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

			.request-summary > div {
				display: grid;
				align-content: start;
				gap: 0.35rem;
			}

			.request-summary > div:nth-child(-n + 3) {
				grid-template-rows: minmax(3.1rem, auto) auto;
			}

			.request-summary > div:nth-child(-n + 3) {
				grid-column: span 2;
			}

			.request-summary > div:nth-child(n + 4) {
				grid-column: span 3;
			}

			.request-summary strong {
				display: block;
				color: var(--irish-life-ink);
				font-size: 1.08rem;
				font-weight: 650;
			}

			.request-summary .irish-life-detail-label {
				color: #677b99;
			}

			.request-summary > div:nth-child(-n + 3) .irish-life-detail-label {
				min-height: 0;
				display: block;
			}

			@media (max-width: 900px) {
				.request-summary {
					grid-template-columns: repeat(2, minmax(0, 1fr));
				}

				.request-summary > div:nth-child(-n + 3),
				.request-summary > div:nth-child(n + 4) {
					grid-column: span 1;
				}

				.request-summary > div:nth-child(-n + 3) {
					grid-template-rows: auto;
				}

				.request-summary > div:nth-child(-n + 3) .irish-life-detail-label {
					min-height: 0;
					display: block;
				}
			}

			@media (max-width: 640px) {
				.request-summary {
					grid-template-columns: minmax(0, 1fr);
				}
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
			::ng-deep vc-qr-code .example-card {
				border: 2px solid rgba(47, 105, 188, 0.4);
				box-shadow: 0 18px 40px rgba(24, 52, 95, 0.1);
			}
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
		private readonly router: Router,
    private readonly caseService: IrishLifeCaseService,
    private readonly localStorageService: LocalStorageService,
    private readonly verifierEndpointService: VerifierEndpointService,
    private readonly changeDetectorRef: ChangeDetectorRef
	) {}

	ngOnInit (): void {
		const caseId = this.activeRoute.snapshot.paramMap.get('caseId');
		if (!caseId) {
			this.createDemoCase();
			return;
		}

		this.loadCase(caseId);
	}

	private createDemoCase (): void {
		this.loading = true;
		this.caseService.createExistingBusinessCase({policyNumber: SUPPORTED_DEMO_POLICY_NUMBER})
			.pipe(timeout(15000))
			.subscribe({
				next: (summary) => {
					void this.router.navigate(['/irish-life/existing-business/customer', summary.caseId], {
						replaceUrl: true,
					});
				},
				error: () => {
					this.loading = false;
					this.resultHeadline = 'Policy details unavailable';
					this.resultMessage = 'Emerald Insurance could not open the policy details for this journey.';
					this.changeDetectorRef.detectChanges();
				},
			});
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
				this.resultMessage = 'The requested Emerald Insurance request could not be loaded.';
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
		this.disclosedClaimPaths = [];

		if (summary.currentStatus === 'COMPLETED') {
			this.resultHeadline = 'Withdrawal checks completed';
			this.resultMessage = 'Emerald Insurance has checked your PID and completed the automated decision.';
			return;
		}

		if (summary.currentStatus === 'FAILED' && hasOnlyNonBlockingFailure(summary)) {
			this.resultHeadline = 'Withdrawal checks completed';
			this.resultMessage = 'Emerald Insurance has checked your PID and completed the automated decision.';
			this.validationReasons = [];
			return;
		}

		if (summary.currentStatus === 'FAILED') {
			this.resultHeadline = 'Withdrawal proof could not be accepted';
			this.resultMessage = this.validationReasons.some((reason) => reason.includes('was not disclosed by the wallet')) ?
				'The PID was presented, but one or more required details were not disclosed by the wallet.' :
				summary.failureReason || 'The presented PID did not satisfy the claim checks.';
			return;
		}

		this.resultHeadline = '';
		this.resultMessage = '';
	}

	protected currentStatusLabel (summary: ExistingBusinessCaseSummary): string {
		if (hasOnlyNonBlockingFailure(summary)) {
			return 'Completed';
		}

		return getExistingBusinessCurrentStatusLabel(summary);
	}

	protected isDisplaySuccessful (summary: ExistingBusinessCaseSummary): boolean {
		return summary.currentStatus === 'COMPLETED' || hasOnlyNonBlockingFailure(summary);
	}
}