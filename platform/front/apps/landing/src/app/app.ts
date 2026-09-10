import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangSwitcher } from './shared/lang-switcher/lang-switcher';

@Component({
  imports: [RouterModule, LangSwitcher],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'CRAFT AI';
}
