import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { Header } from './shared/header/header';
import { Scene } from './shared/scene/scene';

@Component({
  imports: [RouterOutlet, Header, Footer, Scene],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
