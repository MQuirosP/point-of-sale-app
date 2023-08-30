import { OptionsService } from './services/optionsService';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoginComponent } from './components/login/login.component';
import { OptionsComponent } from './components/options/options.component';
import { MainBoardComponent } from './components/main-board/main-board.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { FrontPanelComponent } from './components/front-panel/front-panel.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DigitalWatchComponent } from './components/digital-watch/digital-watch.component'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalService } from './services/modalService';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations'
import { LoginService } from './services/login.service';
import { RegisterUserComponent } from './components/register-user/register-user.component';
import { ToastrModule } from 'ngx-toastr';
import { TicketService } from './services/ticket.service';
import { CookieService } from 'ngx-cookie-service';
import { SaleService } from './services/sale.service';
import { PurchaseService } from './services/purchase.service';
import { ReportsComponent } from './components/reports/reports.component';
import { ProductCacheService } from './services/product-cache.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { SharedModule } from './pipes/sharedModule';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    OptionsComponent,
    MainBoardComponent,
    NotFoundComponent,
    FrontPanelComponent,
    DigitalWatchComponent,
    RegisterUserComponent,
    ReportsComponent,
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
    ReactiveFormsModule, NgSelectModule,
  ],
  providers: [
    ModalService,
    LoginService,
    CookieService,
    TicketService,
    SaleService,
    PurchaseService,
    OptionsService,
    ProductCacheService,
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    SharedModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
