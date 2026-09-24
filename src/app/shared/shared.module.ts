import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { DonacionesModalComponent } from './components/donaciones-modal/donaciones-modal.component';
import { TabBarraPrincipalComponent } from './components/tab-barra-principal/tab-barra-principal.component';
import { MonedaPipe } from './pipes/moneda.pipe';

const COMPONENTS = [
  DonacionesModalComponent,
  TabBarraPrincipalComponent
];

@NgModule({
  declarations: [
    ...COMPONENTS,
    MonedaPipe
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  exports: [
    ...COMPONENTS,
    MonedaPipe
  ]
})
export class SharedModule { }
