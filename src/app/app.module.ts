import { OptionsService } from './services/optionsService';
import { Subscription } from 'rxjs';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { PurchaseHistoryComponent } from './components/purchase-history/purchase-history.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { LoginComponent } from './components/login/login.component';
import { OptionsComponent } from './components/options/options.component';
import { MainBoardComponent } from './components/main-board/main-board.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { FrontPanelComponent } from './components/front-panel/front-panel.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DigitalWatchComponent } from './components/digital-watch/digital-watch.component'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DbService } from './services/db.service';
import { ModalService } from './services/modalService';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations'
import { LoginService } from './services/login.service';
import { CookieService } from 'ngx-cookie-service';
import { RegisterUserComponent } from './components/register-user/register-user.component';
import { ToastrModule } from 'ngx-toastr';
import { TicketService } from './services/ticket.service';



@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    ProductListComponent,
    PurchaseHistoryComponent,
    UserProfileComponent,
    LoginComponent,
    ShoppingCartComponent,
    OptionsComponent,
    MainBoardComponent,
    NotFoundComponent,
    FrontPanelComponent,
    DigitalWatchComponent,
    RegisterUserComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 2500,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    ReactiveFormsModule
  ],
  providers: [
    DbService,
    ModalService,
    LoginService,
    CookieService,
    TicketService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
