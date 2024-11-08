import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { Observable, Subscription, switchMap } from 'rxjs';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { OptionsService } from 'src/app/services/options.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ProductCacheService } from 'src/app/services/product-cache.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [fadeAnimation],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('changePasswordModal', { static: false })
  passwordModal!: ElementRef;

  user: string = '';
  isLoggedIn$: Observable<boolean>;
  allowRegisterUsers$: Observable<boolean>;
  private isLoggedInSubscription!: Subscription;
  public username: string;
  public name: string;

  currentPasswordTouched = false;
  newPasswordTouched = false;
  confirmPasswordTouched = false;

  passwordForm: FormGroup;

  constructor(
    private authService: LoginService,
    private optionsService: OptionsService,
    private changeDetectorReference: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private productCache: ProductCacheService
  ) {
    this.authService.username$.subscribe((username) => {
      this.username = username;
    });

    this.authService.name$.subscribe((name) => {
      this.name = name;
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.getLoggedInStatus();
    this.getRegisterStatus();
  }

  ngOnDestroy(): void {
    this.isLoggedInSubscription.unsubscribe();
  }

  openChangePasswordModal() {
    this.passwordModal.nativeElement.style.display = 'block';
    this.passwordModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.passwordModal.nativeElement.classList.add('show');
    }, 50);
  }

  closeChangePasswordModal() {
    this.passwordModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.passwordModal.nativeElement.classList.remove('show');
      this.passwordModal.nativeElement.classList.remove('closing');
      this.passwordModal.nativeElement.style.display = 'none';
    }, 300);
    this.resetForm();
  }

  getRegisterStatus() {
    this.optionsService.fetchRegisterStatus().subscribe((status) => {
      this.allowRegisterUsers$ = this.optionsService.fetchRegisterStatus();
      this.changeDetectorReference.detectChanges();
    });
  }

  getLoggedInStatus() {
    this.isLoggedInSubscription = this.authService.isLoggedIn$.subscribe(
      (isLoggedIn: boolean) => {
        this.isLoggedIn$ = this.authService.isLoggedIn$;
        if (isLoggedIn) {
          this.user = this.authService.getUserName();
          this.user = this.capitalizeFirstLetter(this.user);
        }
      }
    );
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      return;
    }

    const currentPassword = this.passwordForm.value.currentPassword;
    const newPassword = this.passwordForm.value.newPassword;
    const confirmPassword = this.passwordForm.value.confirmPassword;

    if (newPassword !== confirmPassword) {
      this.toastr.error('Las contraseñas no coinciden.');
      return;
    }

    this.authService.username$
      .pipe(
        switchMap((username) => {
          return this.authService.changePassword(
            username,
            currentPassword,
            newPassword
          );
        })
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.toastr.success('¡La contraseña se ha cambiado exitosamente!');
          setTimeout(() => {
            this.closeChangePasswordModal();
          }, 500);
        },
        error: (error) => {
          this.toastr.error('Error al cambiar la contraseña: ' + error);
        },
      });
  }

  capitalizeFirstLetter(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  onLogout() {
    this.authService.onLogout();
    this.user = '';
    this.productCache.setCachedProducts([]); // Borrar la caché de productos
    this.getRegisterStatus();
  }

  createBackup() {
    this.authService.createBackup();
  }

  resetForm() {
    this.passwordForm.reset();
  }

  addFloatingLabelClass(inputId: string) {
    const label = document.querySelector(`label[for="${inputId}"]`);
    label?.classList.add('active');
  }

  removeFloatingLabelClass(inputId: string) {
    const label = document.querySelector(`label[for="${inputId}"]`);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input.value === '') {
      label?.classList.remove('active');
    }
  }

  getUserRole(): string {
    return localStorage.getItem('role');
  }
}
