import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {
  // Injected purely so ThemeService's constructor (which applies the
  // persisted theme immediately) runs at app bootstrap, before any
  // route renders — avoids a flash of the default theme for users who
  // picked a different one.
  constructor(private readonly theme: ThemeService) {}
}