import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WalletLayoutComponent } from '@app/core/layout/wallet-layout/wallet-layout.component';
import { ExistingBusinessCaseSummary, IrishLifeCaseService } from '@core/services/irish-life-case.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, interval } from 'rxjs';
import {
	buildFailureReasons,
	buildValidationDetails,
	disclosedClaimPathsFromSummary,
} from './new-business-validation-details';

@Component({
	selector: 'vc-existing-business-agent',
	standalone: true,
	imports: [
		CommonModule,
		RouterLink,
		WalletLayoutComponent,
		MatButtonModule,
		MatCardModule,
		MatDividerModule,
		MatProgressSpinnerModule,
	],
	template: `
    <vc-wallet-layout>
      <div body class="irish-life-theme irish-life-page">
        <section class="bg-panel irish-life-hero">
          <p class="irish-life-eyebrow">Existing Business Claims</p>
          <div class="hero-headline">
            <div>
              <h1 class="irish-life-display">Claims monitoring workspace</h1>
              <p>
                This monitor follows the customer-driven withdrawal journey end to end. The
                customer starts the request, the verifier requests PID proof automatically, and the
                agent view watches the resulting case states and notifications.
              </p>
            </div>
            <a routerLink="/irish-life" class="irish-life-ghost-link">Back to journey selector</a>
          </div>
        </section>

        <section class="content-grid">
          <mat-card class="irish-life-panel monitor-summary">
            <mat-card-header>
              <mat-card-title>Monitor summary</mat-card-title>
              <mat-card-subtitle>Read-only view of all Existing Business withdrawal requests</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="summary-grid">
                <div>
                  <p class="irish-life-detail-label">Active requests</p>
                  <strong>{{ activeCount }}</strong>
                </div>
                <div>
                  <p class="irish-life-detail-label">Completed</p>
                  <strong>{{ completedCount }}</strong>
                </div>
                <div>
                  <p class="irish-life-detail-label">Failed</p>
                  <strong>{{ failedCount }}</strong>
                </div>
              </div>

              <div class="busy-state" *ngIf="loading">
                <mat-spinner diameter="26"></mat-spinner>
                <span>Loading Existing Business cases...</span>
              </div>

              <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

              <p *ngIf="!loading && cases.length === 0" class="empty-copy">
                No withdrawal requests have been created yet.
              </p>

              <div class="case-list" *ngIf="cases.length > 0">
                <button
                  *ngFor="let caseSummary of cases"
                  mat-stroked-button
                  type="button"
                  class="case-list-item"
                  [class.selected]="caseSummary.caseId === expandedCaseId"
                  (click)="expandedCaseId = caseSummary.caseId"
                >
                  <span>
                    <strong>{{ caseSummary.claimReference }}</strong>
                    <span class="case-meta">Policy {{ caseSummary.policyNumber }}</span>
                  </span>
                  <span class="case-status">{{ caseSummary.currentStatus }}</span>
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="irish-life-panel" *ngIf="selectedCase as currentCase">
            <mat-card-header>
              <mat-card-title>{{ currentCase.claimReference }}</mat-card-title>
              <mat-card-subtitle>Current state: {{ currentCase.currentStatus }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="summary-grid detail-summary-grid">
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
              </div>

              <div class="summary-grid detail-summary-grid">
                <div>
                  <p class="irish-life-detail-label">Requested at</p>
                  <strong>{{ currentCase.requestedAt | date: 'medium' }}</strong>
                </div>
                <div>
                  <p class="irish-life-detail-label">Customer proof page</p>
                  <a [href]="currentCase.customerPortalUrl" target="_blank" rel="noreferrer">
                    Open customer journey
                  </a>
                </div>
                <div>
                  <p class="irish-life-detail-label">Policy application match</p>
                  <strong>{{ currentCase.policyApplicationMatched ? 'Matched' : 'Pending' }}</strong>
                </div>
                <div>
                  <p class="irish-life-detail-label">AML lookup</p>
                  <strong>{{ amlLookupLabel(currentCase) }}</strong>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="timeline-grid">
                <div>
                  <p class="irish-life-detail-label">Case status timeline</p>
                  <div class="irish-life-status-list">
                    <div class="irish-life-status-item" *ngFor="let status of currentCase.statuses">
                      <div>
                        <strong>{{ status.label }}</strong>
                        <p>{{ status.code }}</p>
                      </div>
                      <time>{{ status.at | date: 'medium' }}</time>
                    </div>
                  </div>
                </div>

                <div>
                  <p class="irish-life-detail-label">Agent notifications</p>
                  <div class="irish-life-notification-list">
                    <div class="irish-life-notification-item" *ngFor="let notification of currentCase.notifications">
                      <strong>{{ notification.label }}</strong>
                      <p>{{ notification.message }}</p>
                      <time>{{ notification.at | date: 'medium' }}</time>
                    </div>
                  </div>
                </div>
              </div>

              <div class="error-block" *ngIf="failureReasonsFromSummary(currentCase).length > 0">
                <p class="error-title">Proof failed</p>
                <ul class="error-list">
                  <li *ngFor="let reason of failureReasonsFromSummary(currentCase)">{{ reason }}</li>
                </ul>

                <div class="irish-life-evidence-panel" *ngIf="validationDetailsFromSummary(currentCase).length > 0">
                  <p class="irish-life-detail-label">Verifier comparison</p>
                  <div class="evidence-item" *ngFor="let detail of validationDetailsFromSummary(currentCase)">
                    <p class="evidence-name">{{ detail.label }}</p>
                    <p><strong>Irish Life record:</strong> {{ detail.expected }}</p>
                    <p><strong>Wallet:</strong> {{ detail.actual }}</p>
                  </div>
                  <p class="evidence-note" *ngIf="disclosedClaimPathsFromCase(currentCase).length > 0">
                    Disclosed claim paths: {{ disclosedClaimPathsFromCase(currentCase).join(', ') }}
                  </p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </section>
      </div>
    </vc-wallet-layout>
  `,
	styles: [
		`
      :host { display: block; }

      .hero-headline,
      .summary-grid,
      .timeline-grid,
      .content-grid,
      .case-list {
        display: grid;
        gap: 1rem;
      }

      .hero-headline,
      .timeline-grid,
      .content-grid {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }

      .summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .detail-summary-grid {
        margin-bottom: 1rem;
      }

      .case-list-item {
        justify-content: space-between;
        padding: 0.9rem 1rem;
        border-radius: 16px;
        border-color: var(--irish-life-line);
      }

      .case-list-item.selected {
        background: #f1f6fd;
        border-color: var(--irish-life-blue);
      }

      .case-list-item,
      .busy-state {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .case-list-item span {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .case-meta,
      .case-status,
      .empty-copy {
        color: #52617f;
      }

      .busy-state {
        color: #445272;
      }

      .error,
      .error-title,
      .error-list {
        color: #b42318;
      }

      .error-list {
        margin: 0;
        padding-left: 1.2rem;
      }

      .evidence-item + .evidence-item {
        margin-top: 0.85rem;
        padding-top: 0.85rem;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
      }

      .evidence-name,
      .evidence-item p,
      .evidence-note {
        margin: 0.2rem 0;
      }
    `,
	],
})
export class ExistingBusinessAgentComponent implements OnInit, OnDestroy {
	cases: ExistingBusinessCaseSummary[] = [];
	expandedCaseId?: string;
	loading = true;
	errorMessage = '';
	private pollSubscription?: Subscription;

	constructor (
		private readonly caseService: IrishLifeCaseService,
		private readonly changeDetectorRef: ChangeDetectorRef
	) {}

	ngOnInit (): void {
		this.loadCases();
		this.pollSubscription = interval(5000).subscribe(() => this.loadCases(false));
	}

	ngOnDestroy (): void {
		this.pollSubscription?.unsubscribe();
	}

	get activeCount (): number {
		return this.cases.filter((caseSummary) => !this.isTerminalState(caseSummary)).length;
	}

	get completedCount (): number {
		return this.cases.filter((caseSummary) => caseSummary.currentStatus === 'COMPLETED').length;
	}

	get failedCount (): number {
		return this.cases.filter((caseSummary) => caseSummary.currentStatus === 'FAILED').length;
	}

	get selectedCase (): ExistingBusinessCaseSummary | undefined {
		return this.cases.find((caseSummary) => caseSummary.caseId === this.expandedCaseId) ?? this.cases[0];
	}

	failureReasonsFromSummary (summary: ExistingBusinessCaseSummary): string[] {
		return buildFailureReasons(summary);
	}

	validationDetailsFromSummary (summary: ExistingBusinessCaseSummary) {
		return buildValidationDetails(summary);
	}

  amlLookupLabel (summary: ExistingBusinessCaseSummary): string {
    if (summary.amlRecordFound) {
      return 'Record found';
    }

    return summary.statuses.some((status) => status.code === 'AML_RECORD_NOT_FOUND') ?
      'No match found' :
      'Pending';
  }

	disclosedClaimPathsFromCase (summary: ExistingBusinessCaseSummary): string[] {
		return disclosedClaimPathsFromSummary(summary);
	}

	private loadCases (showLoading = true): void {
		if (showLoading) {
			this.loading = true;
		}

		this.caseService.listExistingBusinessCases().subscribe({
			next: (cases) => {
				this.cases = cases;
				this.expandedCaseId = this.defaultExpandedCaseId(cases);
				this.errorMessage = '';
				this.loading = false;
				this.changeDetectorRef.detectChanges();
			},
			error: () => {
				this.loading = false;
				this.errorMessage = 'Unable to refresh the Existing Business monitor.';
				this.changeDetectorRef.detectChanges();
			},
		});
	}

	private defaultExpandedCaseId (cases: ExistingBusinessCaseSummary[]): string | undefined {
		const activeCase = cases.find((caseSummary) => !this.isTerminalState(caseSummary));
		if (activeCase) {
			return activeCase.caseId;
		}

		if (this.expandedCaseId && cases.some((caseSummary) => caseSummary.caseId === this.expandedCaseId)) {
			return this.expandedCaseId;
		}

		return cases[0]?.caseId;
	}

	private isTerminalState (summary: ExistingBusinessCaseSummary): boolean {
		return summary.currentStatus === 'COMPLETED' || summary.currentStatus === 'FAILED';
	}
}