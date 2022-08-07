import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesRoutingModule } from './pages/pages-routing.module';

const routes: Routes = [
  // Redirect to home if not found
  { path: '**', redirectTo: '/search' },
];

@NgModule({
  imports: [PagesRoutingModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
