import { ChangeDetectorRef, Component } from '@angular/core';
import { fadeAnimation } from './animations/fadeAnimation';
import { LoginService } from './services/login.service';
import { Router } from '@angular/router';
import { ModalService } from './services/modal.service';
import { Observable, Subscription } from 'rxjs';
import { OptionsService } from './services/options.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fadeAnimation]
})
export class AppComponent {
  title = 'frontend';

  subscription: Subscription = new Subscription();
  isLoggedIn$: Observable<boolean>
  allowRegisterUsers$: Observable<boolean>;
  private isLoggedInSubscription!: Subscription;

  constructor (
    private authService: LoginService,
    private modalService: ModalService,
    private optionsService: OptionsService,
    private changeDetectorReference: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getLoggedInStatus();
    this.getRegisterStatus();
    this.authService.checkLoggedIn();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  openSaleModal() {
    // this.router.navigate(["/shopping-cart"]);
    setTimeout(() => {
      this.modalService.showNewSaleModal.next(true);
    }, 300);
  }

  closeSaleModal() {
    setTimeout(() => {
      this.modalService.showNewSaleModal.next(false);
    }, 300);
  }

  getLoggedInStatus() {
    this.isLoggedInSubscription = this.authService.isLoggedIn$.subscribe(
      (isLoggedIn: boolean) => {
        this.isLoggedIn$ = this.authService.isLoggedIn$;
        if (isLoggedIn) {
          
        }
      }
    );
  }

  getRegisterStatus() {
    this.optionsService.fetchRegisterStatus().subscribe((status) => {
      this.allowRegisterUsers$ = this.optionsService.fetchRegisterStatus();
      this.changeDetectorReference.detectChanges();
    });
  }
}
