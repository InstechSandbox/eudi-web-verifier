import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WalletLayoutComponent } from '@app/core/layout/wallet-layout/wallet-layout.component';

@Component({
	selector: 'vc-irish-life-journey-selector',
	standalone: true,
	imports: [CommonModule, RouterLink, WalletLayoutComponent],
	template: `
    <vc-wallet-layout>
      <div body class="irish-life-shell irish-life-theme irish-life-page">
        <section class="hero bg-panel irish-life-hero">
          <p class="eyebrow irish-life-eyebrow">Irish Life verifier</p>
          <h1 class="irish-life-display">Dual-surface proof journeys for Irish Life</h1>
          <p class="lede">
            Start from the agent workflow or go directly to the customer proof page.
            The verifier keeps both surfaces aligned on the same case state.
          </p>
        </section>

        <section class="journey-grid">
          <article class="journey-card primary">
            <p class="label">Journey 1</p>
            <h2>New Business Agent</h2>
            <p>
              Create a case, trigger AML, send the invite, and monitor proof collection.
            </p>
            <a routerLink="/irish-life/new-business/agent" class="journey-link">
              Open agent workspace
            </a>
          </article>

          <article class="journey-card accent">
            <p class="label">Customer entry</p>
            <h2>New Business Customer</h2>
            <p>
              Enter a case reference or open the customer flow from an emailed link.
            </p>
            <a routerLink="/irish-life/new-business/customer" class="journey-link">
              Open customer proof page
            </a>
          </article>

          <article class="journey-card muted placeholder">
            <p class="label">Journey 2</p>
            <h2>Existing Business Claims</h2>
            <p>
              Customer-led withdrawal request with automatic PID proof handoff and a read-only agent monitor.
            </p>
            <a routerLink="/irish-life/existing-business/agent" class="journey-link">Open monitoring workspace</a>
          </article>

          <article class="journey-card accent">
            <p class="label">Customer entry</p>
            <h2>Existing Business Customer</h2>
            <p>
              Enter your policy number, request the withdrawal, and continue directly into wallet proof sharing.
            </p>
            <a routerLink="/irish-life/existing-business/customer" class="journey-link">
              Start customer journey
            </a>
          </article>
        </section>
      </div>
    </vc-wallet-layout>
  `,
	styles: [
		`
      :host { display: block; }

      .irish-life-shell {
        overflow: hidden;
      }

      .eyebrow,
      .label {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
      }

      h1,
      h2 { line-height: 1.05; margin: 0; font-family: Georgia, 'Times New Roman', serif; }

      h1 { max-width: 11ch; }

      .lede {
        color: rgba(255, 255, 255, 0.86);
        max-width: 34rem;
        margin: 1rem 0 0;
        font-size: 1rem;
      }

      .journey-grid {
        display: grid;
        gap: 1rem;
      }

      .journey-card {
        border-radius: 20px;
        padding: 1.4rem;
        background: white;
        border: 1px solid rgba(36, 87, 166, 0.08);
        box-shadow: 0 18px 48px rgba(24, 52, 95, 0.08);
      }

      .journey-card.primary {
        background: linear-gradient(180deg, #ffffff, var(--irish-life-paper));
      }

      .journey-card.accent {
        background: linear-gradient(180deg, #eef4fc, #ffffff);
      }

      .journey-card.muted {
        background: #eff3f8;
        color: #445272;
      }

      .journey-card h2 {
        font-size: 1.7rem;
        color: var(--irish-life-ink);
      }

      .journey-card p {
        margin: 0.9rem 0 1.2rem;
      }

      .journey-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.75rem;
        padding: 0 1rem;
        border-radius: 999px;
        background: var(--irish-life-blue);
        color: white;
        text-decoration: none;
        font-weight: 700;
        box-shadow: 0 10px 24px rgba(36, 87, 166, 0.18);
      }

      .journey-link.disabled {
        background: #d6ddea;
        color: #5a6784;
      }
    `,
	],
})
export class IrishLifeJourneySelectorComponent {}