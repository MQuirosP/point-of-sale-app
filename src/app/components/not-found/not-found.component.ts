import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { LoginService } from 'src/app/services/login.service';


@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css'],
  animations: [fadeAnimation]
})
export class NotFoundComponent {

  constructor(
    private loginService: LoginService,
    private router: Router,
  ) {

  }

  ngOnInit() {
    this.redirectToNotFound();
  }

  redirectToNotFound() {
    if (this.loginService.isLoggedInValue()) {
      this.router.navigate(['/home'])
    } else {
      this.loginService.setLoggedIn(false);
      this.router.navigate(['/not-found']);
    }
  }
}
