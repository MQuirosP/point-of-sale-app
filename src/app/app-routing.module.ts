import { NgModule } from '@angular/core';
import { RouterModule, Routes, CanActivate, CanActivateFn } from '@angular/router';
import { MainBoardComponent } from './components/main-board/main-board.component';
import { LoginComponent } from './components/login/login.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { OptionsComponent } from './components/options/options.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { PurchaseHistoryComponent } from './components/purchase-history/purchase-history.component';
import { FrontPanelComponent } from './components/front-panel/front-panel.component';
import { AuthGuard } from './guards/auth.guard';
import { RegisterUserComponent } from './components/register-user/register-user.component';
import { ReportsComponent } from './components/reports/reports.component';
import { RoleGuard } from './guards/role-guard.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: FrontPanelComponent, canActivate: [AuthGuard] },
  { path: 'register', component: RegisterUserComponent },
  { path: 'shopping-cart', component: ShoppingCartComponent, canActivate: [AuthGuard] },
  { path: 'purchase-history', component: PurchaseHistoryComponent, canActivate: [AuthGuard]},
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard, RoleGuard]},
  { path: 'options', component: OptionsComponent, canActivate: [AuthGuard] },
  { path: 'product-list', component: ProductListComponent, canActivate: [AuthGuard]},
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}