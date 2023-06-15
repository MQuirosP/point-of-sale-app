import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainBoardComponent } from './components/main-board/main-board.component';
import { LoginComponent } from './components/login/login.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { OptionsComponent } from './components/options/options.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { PurchaseHistoryComponent } from './components/purchase-history/purchase-history.component';

const routes: Routes = [
  { path: '', component: MainBoardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: UserProfileComponent },
  { path: 'shopping-cart', component: ShoppingCartComponent },
  { path: 'purchase-history', component: PurchaseHistoryComponent },
  { path: 'options', component: OptionsComponent },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
