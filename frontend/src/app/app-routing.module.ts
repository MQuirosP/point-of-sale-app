import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { OptionsComponent } from './components/options/options.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { FrontPanelComponent } from './components/front-panel/front-panel.component';
import { AuthGuard } from './guards/auth.guard';
import { RegisterUserComponent } from './components/register-user/register-user.component';
import { ReportsComponent } from './components/reports/reports.component';
import { RoleGuard } from './guards/role-guard.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: FrontPanelComponent, canActivate: [AuthGuard] },
  { path: 'register', component: RegisterUserComponent },
  { path: 'shopping-cart', loadChildren: () => import('./components/shopping-cart/shoppint-cart.module').then(m => m.ShoppingCartModule), canActivate: [AuthGuard] },
  { path: 'purchase-history', loadChildren: () => import('./components/purchase-history/purchase-history.module').then(m => m.PurchaseHistoryModule), canActivate: [AuthGuard]},
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'options', component: OptionsComponent, canActivate: [AuthGuard] },
  { path: 'product-list', loadChildren: () => import('./components/product-list/product-list.module').then(m => m.ProductListModule), canActivate: [AuthGuard]},
  { path: 'not-found', component: NotFoundComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
  // { path: 'product-list', component: ProductListComponent, canActivate: [AuthGuard] },
  // { path: 'purchase-history', component: PurchaseHistoryComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}