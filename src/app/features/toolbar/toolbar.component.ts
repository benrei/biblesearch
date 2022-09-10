import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppService } from 'src/app/app.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent implements OnInit {
  @Output() menuClick = new EventEmitter();
  @Output() filterClick = new EventEmitter();
  @Input() title = 'BibleSearch';

  constructor(public appService: AppService) {}

  ngOnInit(): void {}
}
