import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import { PurchaseHistoryComponent } from './components/purchase-history/purchase-history.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { LoginComponent } from './components/login/login.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { SalesHistoryComponent } from './components/sales-history/sales-history.component';
import { OptionsComponent } from './components/options/options.component';
import { MainBoardComponent } from './components/main-board/main-board.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { FrontPanelComponent } from './components/front-panel/front-panel.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DigitalWatchComponent } from './components/digital-watch/digital-watch.component'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DbService } from './services/db.service';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    ProductListComponent,
    ProductDetailsComponent,
    PurchaseHistoryComponent,
    UserProfileComponent,
    LoginComponent,
    ShoppingCartComponent,
    SalesHistoryComponent,
    OptionsComponent,
    MainBoardComponent,
    NotFoundComponent,
    FrontPanelComponent,
    DigitalWatchComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
  ],
  providers: [
    DbService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
