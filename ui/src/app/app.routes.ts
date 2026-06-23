import { Routes } from '@angular/router';
import { MapPageComponent } from './map/map-page.component';

export const routes: Routes = [{ path: 'map', component: MapPageComponent }, { path: '', redirectTo: 'map', pathMatch: 'full' }];
