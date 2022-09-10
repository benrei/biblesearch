import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsPage } from './settings.page';
import { InputSwitchModule } from 'primeng/inputswitch';
import { Route, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

const routes: Route[] = [
  { path: '', pathMatch: 'full', component: SettingsPage },
];

@NgModule({
  declarations: [SettingsPage],
  imports: [
    CommonModule,
    InputSwitchModule,
    RouterModule.forChild(routes),
    FormsModule,
  ],
})
export class SettingsModule {}
