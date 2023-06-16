import { DbService } from './../../services/db.service';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { fadeAnimation } from 'src/app/fadeAnimation';

@Component({
  selector: 'app-main-board',
  templateUrl: './main-board.component.html',
  styleUrls: ['./main-board.component.css'],
  animations: [fadeAnimation]
})
export class MainBoardComponent {
  
}