import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WalletLayoutComponent } from '@app/core/layout/wallet-layout/wallet-layout.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
	selector: 'vc-new-business-customer-entry',
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
	],
	template: `
    <vc-wallet-layout>
      <div body class="page irish-life-theme irish-life-page">
        <section class="bg-panel irish-life-hero">
          <p class="irish-life-eyebrow">New Business</p>
          <h1 class="irish-life-display">Open your proof page</h1>
          <p>
            Use the customer link from your email or enter the case ID below to continue your proof request.
          </p>
        </section>

        <mat-card class="panel bg-panel irish-life-panel">
          <p>
            If you received an Emerald Insurance email, use that direct link. Otherwise enter the
            case ID from the email or the agent workspace.
          </p>

          <form [formGroup]="form" class="entry-form" (ngSubmit)="openCase()">
            <mat-form-field appearance="outline" class="irish-life-soft-input">
              <mat-label>Case ID</mat-label>
              <input matInput formControlName="caseId" />
            </mat-form-field>

            <div class="actions-row">
              <button mat-flat-button color="primary" class="brand-button" type="submit" [disabled]="form.invalid">
                Open proof page
              </button>
              <a routerLink="/irish-life" class="ghost-link irish-life-ghost-link inline-link">Back to selector</a>
            </div>
          </form>
        </mat-card>
      </div>
    </vc-wallet-layout>
  `,
	styles: [
		`
      :host {
        --irish-life-navy: #2457a6;
        --irish-life-blue: #4f86d6;
        --irish-life-line: #d2def1;
        display: block;
      }
      .page { padding-top: 1.5rem; }
      .panel { margin-top: 1rem; }
      .entry-form {
        margin-top: 1.25rem;
        display: grid;
        gap: 1rem;
      }

      ::ng-deep .irish-life-soft-input .mat-mdc-text-field-wrapper {
        background: #edf3f7;
        border-radius: 14px;
      }

      ::ng-deep .irish-life-soft-input .mdc-notched-outline__leading,
      ::ng-deep .irish-life-soft-input .mdc-notched-outline__notch,
      ::ng-deep .irish-life-soft-input .mdc-notched-outline__trailing {
        border-color: #c9d6e4;
      }

      ::ng-deep .irish-life-soft-input.mat-focused .mdc-notched-outline__leading,
      ::ng-deep .irish-life-soft-input.mat-focused .mdc-notched-outline__notch,
      ::ng-deep .irish-life-soft-input.mat-focused .mdc-notched-outline__trailing {
        border-color: #7f9bc0;
      }
      .actions-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .brand-button { color: white; }
      .brand-button[disabled] {
        background: #d6ddea;
        color: #67748f;
      }
      .ghost-link {
        display: inline-flex;
        align-items: center;
        min-height: 2.25rem;
        text-decoration: none;
        color: var(--irish-life-navy);
        font-weight: 700;
      }
    `,
	],
})
export class NewBusinessCustomerEntryComponent {
	readonly form = this.formBuilder.nonNullable.group({
		caseId: ['', Validators.required],
	});

	constructor (
    private readonly formBuilder: FormBuilder,
    private readonly router: Router
	) {}

	openCase (): void {
		const caseId = this.form.controls.caseId.value.trim();
		if (!caseId) {
			return;
		}

		void this.router.navigate(['/irish-life/new-business/customer', caseId]);
	}
}