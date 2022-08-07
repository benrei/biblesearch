import { Component } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent {
  menuItems = [
    { title: 'Search', path: '/search' },
    { title: 'Read', path: '/read' },
    { title: 'About', path: '/about' },
  ];
  constructor() {}
}
