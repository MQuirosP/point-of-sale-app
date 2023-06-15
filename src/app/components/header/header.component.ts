import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
 isLoggedIn: boolean = true;
//  isLoggetInUser: boolean = true;

 constructor() {}

 ngOnInit() {
  this.isLoggedIn = true;
 }
}
