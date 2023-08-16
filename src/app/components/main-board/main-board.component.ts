import { Component } from '@angular/core';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';

@Component({
  selector: 'app-main-board',
  templateUrl: './main-board.component.html',
  styleUrls: ['./main-board.component.css'],
  animations: [fadeAnimation]
})
export class MainBoardComponent {
  
}