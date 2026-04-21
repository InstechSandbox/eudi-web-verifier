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
      <div body class="irish-life-shell irish-life-theme">
        <section class="hero bg-panel irish-life-hero">
          <p class="eyebrow irish-life-eyebrow">Emerald Insurance verifier</p>
          <h1 class="irish-life-display">Emerald Insurance journeys</h1>
          <p class="lede">
            Choose the agent workspace or open the customer page directly.
            Each journey keeps the customer and agent views aligned on the same case.
          </p>
        </section>

        <section class="journey-grid">
          <article class="journey-card muted placeholder journey-two">
            <p class="label">Journey 1</p>
            <h2>Existing Business agent monitor</h2>
            <p>
              Follow customer-led account checks with automatic PID proof sharing and a read-only monitor.
            </p>
            <a routerLink="/irish-life/existing-business/agent" class="journey-link">Open agent monitoring workspace</a>
          </article>

          <article class="journey-card accent journey-two">
            <p class="label">Journey 1</p>
            <h2>Existing Business customer</h2>
            <p>
              Open a prefilled policy view and continue straight into wallet proof sharing.
            </p>
            <a routerLink="/irish-life/existing-business/customer" class="journey-link">
              Open customer journey
            </a>
          </article>

          <article class="journey-card primary journey-one">
            <p class="label">Journey 2</p>
            <h2>New Business agent</h2>
            <p>
              Create a case, send the proof request, and monitor progress.
            </p>
            <a routerLink="/irish-life/new-business/agent" class="journey-link">
              Open agent workspace
            </a>
          </article>

          <article class="journey-card accent journey-one">
            <p class="label">Journey 2</p>
            <h2>New Business customer</h2>
            <p>
              Open the proof page from an email link or enter the case ID here.
            </p>
            <a routerLink="/irish-life/new-business/customer" class="journey-link">
              Open customer journey
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
        padding: 1.5rem 0 2rem;
      }

      .eyebrow,
      .label {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.96rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
      }

      h1,
      h2 { line-height: 1.05; margin: 0; font-family: Georgia, 'Times New Roman', serif; }

      h1 { max-width: 11ch; }

      .lede {
        color: var(--irish-life-ink-strong);
        max-width: 34rem;
        margin: 1rem 0 0;
        font-size: 1.125rem;
        line-height: 1.6;
        font-weight: 700;
      }

      .journey-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 1rem;
        width: 100%;
      }

      .journey-card {
        min-width: 0;
        width: 100%;
        box-sizing: border-box;
        border-radius: 20px;
        padding: 1.5rem;
        background: white;
        border: 1px solid rgba(36, 87, 166, 0.08);
        box-shadow: 0 18px 48px rgba(24, 52, 95, 0.08);
        position: relative;
        overflow: hidden;
      }

      .journey-card::before {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: 6px;
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

      .journey-card.journey-one::before {
        background: linear-gradient(180deg, var(--irish-life-blue), #8cb6ee);
      }

      .journey-card.journey-two::before {
        background: linear-gradient(180deg, #6d8ebc, #d0dceb);
      }

      .journey-card h2 {
        font-size: 1.9rem;
        color: var(--irish-life-ink);
      }

      .journey-card p {
        margin: 0.9rem 0 1.2rem;
        font-size: 1.05rem;
        line-height: 1.65;
      }

      .journey-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 3.2rem;
        padding: 0.3rem 1.3rem;
        border-radius: 999px;
        background: linear-gradient(180deg, var(--irish-life-blue), var(--irish-life-blue-deep));
        color: white;
        text-decoration: none;
        font-weight: 800;
        font-size: 1.05rem;
        box-shadow: 0 14px 26px rgba(36, 87, 166, 0.22);
      }

      .journey-link.disabled {
        background: #d6ddea;
        color: #5a6784;
      }
    `,
	],
})
export class IrishLifeJourneySelectorComponent {}