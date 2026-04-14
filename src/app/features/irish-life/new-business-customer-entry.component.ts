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
        <mat-card class="panel bg-panel irish-life-panel">
          <p class="eyebrow irish-life-eyebrow">Customer entry</p>
          <h1 class="irish-life-display">Open your New Business proof page</h1>
          <p>
            If you received an Irish Life email, use the direct link there. Otherwise enter the
            case ID from that link or from the agent workspace.
          </p>

          <form [formGroup]="form" class="entry-form" (ngSubmit)="openCase()">
            <mat-form-field appearance="outline">
              <mat-label>Case ID</mat-label>
              <input matInput formControlName="caseId" />
            </mat-form-field>

            <div class="actions-row">
              <button mat-flat-button color="primary" class="brand-button" type="submit" [disabled]="form.invalid">
                Continue to proof sharing
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
      .panel {
        border-radius: 20px;
        border: 1px solid rgba(36, 87, 166, 0.08);
        box-shadow: 0 18px 44px rgba(24, 52, 95, 0.09);
      }
      h1 {
        margin: 0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(1.9rem, 4vw, 2.8rem);
      }
      .eyebrow {
        margin: 0 0 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
      }
      .entry-form {
        margin-top: 1.25rem;
        display: grid;
        gap: 1rem;
      }
      .actions-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .brand-button {
        background: var(--irish-life-blue);
        color: white;
      }
      .brand-button[disabled] {
        background: #d6ddea;
        color: #67748f;
      }
      .ghost-link {
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