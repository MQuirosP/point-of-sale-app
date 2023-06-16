import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { Observable, Subscription, of } from 'rxjs';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { OptionsService } from 'src/app/services/optionsService';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [fadeAnimation],
})
export class HeaderComponent implements OnInit, OnDestroy {
  user: string = '';
  isLoggedIn$: Observable<boolean>;
  allowRegisterUsers$: Observable<boolean>;
  private isLoggedInSubscription!: Subscription;

  constructor(
    private authService: LoginService,
    private optionsService: OptionsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.isLoggedInSubscription = this.authService.isLoggedIn$.subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn$ = this.authService.isLoggedIn$;
      if (isLoggedIn) {
        this.user = this.authService.getUserName();
        this.user = this.capitalizeFirstLetter(this.user);
      }
    });
    this.optionsService.fetchRegisterStatus().subscribe((status) => {
      this.allowRegisterUsers$ = this.optionsService.getRegisterStatus();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.isLoggedInSubscription.unsubscribe();
  }

  capitalizeFirstLetter(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  onLogout() {
    this.authService.onLogout();
    this.user = '';
  }
}