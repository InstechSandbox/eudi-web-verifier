import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WalletLayoutComponent } from '@app/core/layout/wallet-layout/wallet-layout.component';
import {
	CreateNewBusinessCaseRequest,
	IrishLifeCaseService,
	NewBusinessCaseSummary,
} from '@core/services/irish-life-case.service';
import { QRCodeComponent } from 'angularx-qrcode';
import { EMPTY, Subscription, interval, of } from 'rxjs';
import { catchError, finalize, switchMap, tap, timeout } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
	buildFailureReasons,
	buildValidationDetails,
	disclosedClaimPathsFromSummary,
} from './new-business-validation-details';

@Component({
	selector: 'vc-new-business-agent',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterLink,
		WalletLayoutComponent,
		QRCodeComponent,
		MatButtonModule,
		MatCardModule,
		MatDividerModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule,
	],
	template: `
    <vc-wallet-layout>
      <div body class="page">
        <section class="hero bg-panel">
          <p class="eyebrow">New Business</p>
          <div class="hero-headline">
            <div>
              <h1>Agent orchestration workspace</h1>
              <p>
                Create the case, issue the wallet invite, and track the proof journey to completion.
              </p>
            </div>
            <a routerLink="/irish-life" class="ghost-link">Back to journey selector</a>
          </div>
        </section>

        <section class="content-grid">
          <mat-card class="panel">
            <mat-card-header>
              <mat-card-title>New Business case</mat-card-title>
              <mat-card-subtitle>
                Support-agent entry point for the Irish Life verification flow
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="form" class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Policy reference</mat-label>
                  <input matInput formControlName="policyReference" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Customer given name</mat-label>
                  <input matInput formControlName="customerGivenName" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Customer family name</mat-label>
                  <input matInput formControlName="customerFamilyName" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Customer email</mat-label>
                  <input matInput type="email" formControlName="customerEmail" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Date of birth</mat-label>
                  <input matInput type="date" formControlName="customerBirthDate" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="wide-field">
                  <mat-label>Current address</mat-label>
                  <textarea
                    matInput
                    rows="3"
                    formControlName="customerAddress"
                    placeholder="1 Main Street, Dublin, Leinster, D02 XY56"
                  ></textarea>
                  <mat-hint>
                    For the local PID proof-of-address flow, match the issued wallet PID exactly. If you used the
                    optional structured address fields in the issuer, enter this as
                    street_address, locality, region, postal_code.
                  </mat-hint>
                </mat-form-field>
              </form>

              <div class="actions-row">
                <button
                  mat-flat-button
                  color="primary"
                  class="brand-button"
                  type="button"
                  (click)="createAndSendInvite()"
                  [disabled]="form.invalid || busy"
                >
                  {{ caseSummary ? 'Resend invite' : 'Create case and send invite' }}
                </button>
                <button
                  mat-stroked-button
                  class="secondary-button"
                  type="button"
                  (click)="refreshCase()"
                  [disabled]="!caseSummary || busy"
                >
                  Refresh case
                </button>
                <div class="busy-state" *ngIf="busy">
                  <mat-spinner diameter="28"></mat-spinner>
                  <span>{{ busyMessage }}</span>
                </div>
              </div>

              <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="panel" *ngIf="caseSummary as currentCase">
            <mat-card-header>
              <mat-card-title>{{ currentCase.policyReference }}</mat-card-title>
              <mat-card-subtitle>Current state: {{ currentCase.currentStatus }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="status-list">
                <div class="status-item" *ngFor="let status of currentCase.statuses">
                  <div>
                    <strong>{{ status.label }}</strong>
                    <p>{{ status.code }}</p>
                  </div>
                  <time>{{ status.at | date: 'medium' }}</time>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="detail-block">
                <p class="detail-label">Customer proof page</p>
                <a [href]="currentCase.customerPortalUrl" target="_blank" rel="noreferrer">
                  {{ currentCase.customerPortalUrl }}
                </a>
              </div>

              <div class="qr-panel" *ngIf="currentCase.customerPortalUrl">
                <qrcode
                  [qrdata]="currentCase.customerPortalUrl"
                  [width]="190"
                  [errorCorrectionLevel]="'M'"
                ></qrcode>
                <p>Customer web entry for QR-based handoff</p>
              </div>

              <div class="detail-grid">
                <div>
                  <p class="detail-label">Invite email</p>
                  <strong>{{ currentCase.inviteEmailSent ? 'Sent' : 'Not sent' }}</strong>
                </div>
                <div>
                  <p class="detail-label">Completion email</p>
                  <strong>{{ currentCase.completionEmailSent ? 'Sent' : 'Pending' }}</strong>
                </div>
              </div>

              <ng-container *ngIf="failureReasonsFromSummary(currentCase).length > 0; else failureReasonText">
                <div class="error-block">
                  <p class="error-title">Proof failed</p>
                  <ul class="error-list">
                    <li *ngFor="let reason of failureReasonsFromSummary(currentCase)">{{ reason }}</li>
                  </ul>

                  <div class="evidence-panel" *ngIf="validationDetailsFromSummary(currentCase).length > 0">
                    <p class="detail-label">Verifier comparison</p>
                    <div class="evidence-item" *ngFor="let detail of validationDetailsFromSummary(currentCase)">
                      <p class="evidence-name">{{ detail.label }}</p>
                      <p><strong>Application:</strong> {{ detail.expected }}</p>
                      <p><strong>Wallet:</strong> {{ detail.actual }}</p>
                    </div>
                    <p class="evidence-note" *ngIf="disclosedClaimPathsFromCase(currentCase).length > 0">
                      Disclosed claim paths: {{ disclosedClaimPathsFromCase(currentCase).join(', ') }}
                    </p>
                  </div>
                </div>
              </ng-container>

              <ng-template #failureReasonText>
                <p class="error" *ngIf="currentCase.failureReason">{{ currentCase.failureReason }}</p>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </section>
      </div>
    </vc-wallet-layout>
  `,
	styles: [
		`
      :host {
        --irish-life-navy: #2457a6;
        --irish-life-blue: #4f86d6;
        --irish-life-sky: #e5effb;
        --irish-life-paper: #f8fbff;
        --irish-life-line: #d2def1;
        --irish-life-ink: #18345f;
        display: block;
      }

      .page {
        padding: 1.25rem 0 2rem;
      }

      .hero {
        background: linear-gradient(160deg, #5d92dd, var(--irish-life-navy) 76%);
        color: white;
        margin-bottom: 1.2rem;
      }

      .eyebrow,
      .detail-label {
        margin: 0 0 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.7rem;
        font-weight: 700;
      }

      .hero-headline {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
      }

      h1 {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(2rem, 4vw, 3rem);
        margin: 0 0 0.5rem;
      }

      .ghost-link {
        align-self: flex-start;
        color: white;
        text-decoration: none;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.32);
        border-radius: 999px;
        padding: 0.75rem 1rem;
      }

      .content-grid {
        display: grid;
        gap: 1rem;
      }

      .panel {
        border-radius: 20px;
        border: 1px solid rgba(36, 87, 166, 0.08);
        box-shadow: 0 18px 44px rgba(24, 52, 95, 0.09);
      }

      .brand-button {
        background: var(--irish-life-blue);
        color: white;
      }

      .brand-button[disabled] {
        background: #d6ddea;
        color: #67748f;
      }

      .secondary-button {
        border-color: var(--irish-life-line);
        color: var(--irish-life-navy);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.85rem;
      }

      .wide-field {
        grid-column: 1 / -1;
      }

      .actions-row {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin-top: 1rem;
        flex-wrap: wrap;
      }

      .busy-state {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        color: #445272;
        font-size: 0.95rem;
      }

      .status-list {
        display: grid;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }

      .status-item {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.85rem 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }

      .status-item p,
      .detail-block p {
        margin: 0.2rem 0 0;
        color: #52617f;
      }

      .qr-panel {
        margin: 1.2rem 0;
        padding: 1rem;
        border-radius: 16px;
        background: linear-gradient(180deg, #f1f6fd, var(--irish-life-paper));
        border: 1px solid var(--irish-life-line);
        text-align: center;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }

      .error {
        color: #b42318;
        margin-top: 1rem;
      }

      .error-block {
        margin-top: 1rem;
      }

      .error-title {
        color: #b42318;
        font-weight: 700;
        margin: 0 0 0.35rem;
      }

      .error-list {
        color: #b42318;
        margin: 0;
        padding-left: 1.2rem;
      }

      .evidence-panel {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 16px;
        background: #f1f6fd;
        border: 1px solid var(--irish-life-line);
        color: #18254a;
      }

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
    `,
	],
})
export class NewBusinessAgentComponent implements OnDestroy {
	readonly form = this.formBuilder.nonNullable.group({
		policyReference: [''],
		customerGivenName: ['', Validators.required],
		customerFamilyName: ['', Validators.required],
		customerEmail: ['', [Validators.required, Validators.email]],
		customerBirthDate: ['', Validators.required],
		customerAddress: ['', Validators.required],
	});

	caseSummary?: NewBusinessCaseSummary;
	busy = false;
	busyMessage = '';
	errorMessage = '';
	private pollSubscription?: Subscription;
	private busyTimeoutId?: ReturnType<typeof setTimeout>;
	private busyStep: 'create' | 'invite' | '' = '';
	private lastBusyStep: 'create' | 'invite' | '' = '';

	constructor (
    private readonly formBuilder: FormBuilder,
    private readonly caseService: IrishLifeCaseService,
    private readonly changeDetectorRef: ChangeDetectorRef
	) {}

	createAndSendInvite (): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		this.errorMessage = '';

		const payload: CreateNewBusinessCaseRequest = this.form.getRawValue();
		const caseRequest$ = this.caseSummary ?
			of(this.caseSummary).pipe(tap(() => this.setBusyState('invite', 'Sending invite...'))) :
			this.caseService.createCase(payload).pipe(
				timeout(15000),
				tap(() => this.setBusyState('invite', 'Sending invite...'))
			);

		if (!this.caseSummary) {
			this.setBusyState('create', 'Creating case...');
		} else {
			this.setBusyState('invite', 'Sending invite...');
		}

		caseRequest$
			.pipe(
				switchMap((summary) => this.caseService.inviteCase(summary.caseId).pipe(timeout(15000))),
				finalize(() => {
					this.clearBusyState();
				})
			)
			.subscribe({
				next: (summary) => {
					this.caseSummary = summary;
					this.startPolling();
					this.changeDetectorRef.detectChanges();
				},
				error: (error) => {
					this.errorMessage = this.caseErrorMessage(error);
					this.changeDetectorRef.detectChanges();
				},
			});
	}

	refreshCase (): void {
		if (!this.caseSummary) {
			return;
		}

		this.caseService.getCase(this.caseSummary.caseId).subscribe({
			next: (summary) => {
				this.caseSummary = summary;
				this.changeDetectorRef.detectChanges();
			},
			error: () => {
				this.errorMessage = 'Unable to refresh the current case state.';
				this.changeDetectorRef.detectChanges();
			},
		});
	}

	private startPolling (): void {
		this.pollSubscription?.unsubscribe();
		if (!this.caseSummary) {
			return;
		}

		this.pollSubscription = interval(5000)
			.pipe(
				switchMap(() =>
					this.caseService.getCase(this.caseSummary!.caseId).pipe(
						catchError(() => {
							this.errorMessage = 'Unable to refresh the current case state automatically. Polling will continue.';
							this.changeDetectorRef.detectChanges();
							return EMPTY;
						})
					)
				)
			)
			.subscribe({
				next: (summary) => {
					this.caseSummary = summary;
					this.errorMessage = '';
					if (summary.currentStatus === 'COMPLETED' || summary.currentStatus === 'FAILED') {
						this.pollSubscription?.unsubscribe();
					}
					this.changeDetectorRef.detectChanges();
				},
			});
	}

	ngOnDestroy (): void {
		this.pollSubscription?.unsubscribe();
		this.clearBusyState();
	}

	private caseErrorMessage (error: any): string {
		if (error?.name === 'TimeoutError') {
			return this.lastBusyStep === 'invite' ?
				'Sending the invite took too long. Refresh the case to see whether the backend already created the invite, then try again if needed.' :
				'Creating the case took too long. Refresh the page and try again.';
		}

		return error?.error?.error ?? 'Failed to create or invite the case.';
	}

	private setBusyState (step: 'create' | 'invite', message: string): void {
		this.busy = true;
		this.busyStep = step;
		this.lastBusyStep = step;
		this.busyMessage = message;
		if (this.busyTimeoutId) {
			clearTimeout(this.busyTimeoutId);
		}
		this.busyTimeoutId = setTimeout(() => {
			if (!this.busy) {
				return;
			}
			const timedOutStep = this.busyStep === 'invite' ? 'invite request' : 'case creation';
			this.clearBusyState();
			this.errorMessage = `The verifier UI stopped waiting during ${timedOutStep}. Refresh the case to check whether the backend already completed that step.`;
			this.changeDetectorRef.detectChanges();
		}, 20000);
	}

	private clearBusyState (): void {
		this.busy = false;
		this.busyMessage = '';
		this.busyStep = '';
		if (this.busyTimeoutId) {
			clearTimeout(this.busyTimeoutId);
			this.busyTimeoutId = undefined;
		}
		this.changeDetectorRef.detectChanges();
	}

	protected failureReasonsFromSummary (summary: NewBusinessCaseSummary): string[] {
    return buildFailureReasons(summary);
	}

	protected validationDetailsFromSummary (summary: NewBusinessCaseSummary) {
		return buildValidationDetails(summary);
	}

	protected disclosedClaimPathsFromCase (summary: NewBusinessCaseSummary): string[] {
		return disclosedClaimPathsFromSummary(summary);
	}
}