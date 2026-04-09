import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { WalletRedirectResolver } from '@features/wallet-redirect/resolver/wallet-redirect-resolver';
import { NavigateService } from '@core/services/navigate.service';
import { VerifierEndpointService } from '@core/services/verifier-endpoint.service';
import { WalletRedirectComponent } from './features/wallet-redirect/wallet-redirect.component';

const routes: Routes = [
  { path: '', redirectTo: 'irish-life', pathMatch: 'full' },
  {
    path: 'irish-life',
    loadComponent: () =>
      import('@features/irish-life/irish-life-journey-selector.component').then(
        (c) => c.IrishLifeJourneySelectorComponent
      ),
  },
  {
    path: 'irish-life/new-business/agent',
    loadComponent: () =>
      import('@features/irish-life/new-business-agent.component').then(
        (c) => c.NewBusinessAgentComponent
      ),
  },
  {
    path: 'irish-life/new-business/customer',
    loadComponent: () =>
      import('@features/irish-life/new-business-customer-entry.component').then(
        (c) => c.NewBusinessCustomerEntryComponent
      ),
  },
  {
    path: 'irish-life/new-business/customer/:caseId',
    loadComponent: () =>
      import('@features/irish-life/new-business-customer.component').then(
        (c) => c.NewBusinessCustomerComponent
      ),
  },
  {
    path: 'home',
    loadComponent: () =>
      import(
        '@features/presentation-request-preparation/home/home.component'
      ).then((c) => c.HomeComponent),
  },
  {
    path: 'custom-request',
    loadChildren: () =>
      import(
        '@features/custom-presentation-request/custom-presentation-request.module'
      ).then((m) => m.CustomPresentationRequestModule),
  },
  {
    path: 'invoke-wallet',
    loadChildren: () =>
      import('@features/invoke-wallet/invoke-wallet.module').then(
        (m) => m.InvokeWalletModule
      ),
  },
  {
    path: 'get-wallet-code',
    component: WalletRedirectComponent,
    providers: [VerifierEndpointService, NavigateService],
    resolve: {
      data: WalletRedirectResolver,
    },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: false,
      paramsInheritanceStrategy: 'always',
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
