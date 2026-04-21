import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WalletLayoutComponent } from '@app/core/layout/wallet-layout/wallet-layout.component';
import { ACTIVE_TRANSACTION } from '@core/constants/general';
import { IrishLifeCaseService } from '@core/services/irish-life-case.service';
import { LocalStorageService } from '@core/services/local-storage.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { timeout } from 'rxjs/operators';

const SUPPORTED_DEMO_POLICY_NUMBER = '12345678';

@Component({
	selector: 'vc-existing-business-customer-entry',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterLink,
		WalletLayoutComponent,
		MatButtonModule,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		MatProgressSpinnerModule,
	],
	template: `
    <vc-wallet-layout>
      <div body class="irish-life-theme irish-life-page">
        <section class="bg-panel irish-life-hero">
          <p class="irish-life-eyebrow">Existing Business</p>
          <h1 class="irish-life-display">Withdrawal request</h1>
          <p>
            Start the withdrawal request below and we will prepare the wallet proof step automatically.
          </p>
        </section>

        <mat-card class="bg-panel irish-life-panel">
          <p>
            Enter your policy number to start the automated Emerald Insurance withdrawal journey. The
            verifier will immediately prepare the wallet proof request and move you into proof
            sharing without agent intervention.
          </p>

				<p class="hint">Local demo policy number: <strong>12345678</strong></p>

          <form [formGroup]="form" class="entry-form" (ngSubmit)="requestWithdrawal()">
            <mat-form-field appearance="outline">
              <mat-label>Policy number</mat-label>
              <input matInput formControlName="policyNumber" inputmode="numeric" maxlength="8" />
            </mat-form-field>

            <div class="actions-row">
              <button mat-flat-button color="primary" class="irish-life-brand-button" type="submit" [disabled]="form.invalid || busy">
                Request withdrawal
              </button>
              <a routerLink="/irish-life" class="irish-life-ghost-link inline-link">Back to selector</a>
					<div class="busy-state" *ngIf="busy">
						<mat-spinner diameter="24"></mat-spinner>
						<span>Preparing wallet proof request...</span>
					</div>
            </div>

				<p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
          </form>
        </mat-card>
      </div>
    </vc-wallet-layout>
  `,
	styles: [
		`
      :host { display: block; }
  .irish-life-panel { margin-top: 1rem; }
      .entry-form { margin-top: 1.25rem; display: grid; gap: 1rem; }
      .actions-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
      .hint { color: #2f4672; margin: 0.75rem 0 0; }
      .busy-state { display: inline-flex; gap: 0.6rem; align-items: center; color: #445272; }
      .error { color: #b42318; margin: 0; }
    `,
	],
})
export class ExistingBusinessCustomerEntryComponent {
	readonly form = this.formBuilder.nonNullable.group({
    policyNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
	});
  busy = false;
  errorMessage = '';

	constructor (
    private readonly formBuilder: FormBuilder,
    private readonly caseService: IrishLifeCaseService,
    private readonly localStorageService: LocalStorageService,
    private readonly router: Router
	) {}

  requestWithdrawal (): void {
    const policyNumber = this.form.controls.policyNumber.value.trim();
    if (!policyNumber) {
			return;
		}

    if (policyNumber !== SUPPORTED_DEMO_POLICY_NUMBER) {
      this.errorMessage = `Only demo policy number ${SUPPORTED_DEMO_POLICY_NUMBER} is supported for the Existing Business flow.`;
      return;
    }

    this.busy = true;
    this.errorMessage = '';

    this.caseService.createExistingBusinessCase({policyNumber})
      .pipe(timeout(15000))
      .subscribe({
        next: (summary) => {
          if (summary.activeTransaction) {
            this.localStorageService.set(ACTIVE_TRANSACTION, JSON.stringify(summary.activeTransaction));
          }
          this.busy = false;
          void this.router.navigate(['/irish-life/existing-business/customer', summary.caseId]);
        },
        error: (error) => {
          this.busy = false;
          this.errorMessage = typeof error?.error?.error === 'string' ?
            error.error.error :
            'Unable to start the withdrawal request.';
        },
      });
	}
}