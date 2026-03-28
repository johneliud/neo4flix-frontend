import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  styles: [
    `
      :host {
        --bright-blue: oklch(51.01% 0.274 263.83);
        --gray-900: oklch(19.37% 0.006 300.98);
        --gray-700: oklch(36.98% 0.014 302.71);
        --gray-400: oklch(70.9% 0.015 304.04);
      }

      .container {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
      }

      .code {
        font-size: clamp(5rem, 20vw, 10rem);
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.04em;
        color: var(--gray-900);
        margin: 0;
      }

      .divider {
        width: 2rem;
        height: 2px;
        background: var(--gray-400);
        margin: 1.5rem auto;
      }

      .heading {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--gray-900);
        margin: 0 0 0.5rem;
      }

      .message {
        font-size: 0.9375rem;
        color: var(--gray-700);
        margin: 0 0 2rem;
        max-width: 30ch;
        line-height: 1.6;
      }

      .link {
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--bright-blue);
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color 150ms ease-out;
      }

      .link:hover {
        border-color: var(--bright-blue);
      }

      .link:focus-visible {
        outline: 2px solid var(--bright-blue);
        outline-offset: 3px;
        border-radius: 2px;
      }
    `,
  ],
  template: `
    <div class="container">
      <p class="code">404</p>
      <div class="divider"></div>
      <h1 class="heading">Page not found</h1>
      <p class="message">The page you are looking for does not exist or has been moved.</p>
      <a routerLink="/" class="link">Go to home</a>
    </div>
  `,
})
export class NotFoundComponent {}
