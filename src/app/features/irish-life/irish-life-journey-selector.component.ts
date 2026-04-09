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
      <div body class="irish-life-shell">
        <section class="hero bg-panel">
          <p class="eyebrow">Irish Life verifier</p>
          <h1>Dual-surface proof journeys for New Business</h1>
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
              Reserved for the future claims journey with distinct agent and customer surfaces.
            </p>
            <span class="journey-link disabled">Coming next</span>
          </article>
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

      .irish-life-shell {
        padding: 1.5rem 0 2rem;
      }

      .hero {
        background:
          radial-gradient(circle at top right, rgba(191, 215, 247, 0.45), transparent 32%),
          linear-gradient(145deg, #5d92dd, var(--irish-life-navy) 78%);
        color: white;
        margin-bottom: 1.5rem;
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
      h2 {
        font-family: Georgia, 'Times New Roman', serif;
        line-height: 1.05;
        margin: 0;
      }

      h1 {
        font-size: clamp(2rem, 5vw, 3.4rem);
        max-width: 11ch;
      }

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