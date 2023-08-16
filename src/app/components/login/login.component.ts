import { Component } from '@angular/core';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { LoginService } from 'src/app/services/login.service';
import { ProductCacheService } from 'src/app/services/product-cache.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [fadeAnimation],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoggedIn: boolean = false;

  constructor(
    private authService: LoginService,
    private productCache: ProductCacheService
  ) {}

  onSubmit() {
    this.authService.onLogin(this.username, this.password);
    this.loadProductCache();
    // this.authService.setLoggedIn(true);
  }

  private loadProductCache() {
    const cachedProducts = this.productCache.getCachedProducts();
    // Realiza las operaciones necesarias con la caché de productos
    // ...
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
}
