import { trigger, state, style, transition, animate } from '@angular/animations';

export const productAnimations = [
  trigger('slideInOut', [
    state(
      'in',
      style({
        transform: 'translateX(0)',
        opacity: 1,
      })
    ),
    state(
      'out',
      style({
        transform: 'translateX(-100%)',
        opacity: 0,
      })
    ),
    transition('in => out', animate('200ms ease-out')),
    transition('out => in', animate('200ms ease-in')),
  ]),
  trigger('slideOut', [
    state(
      'in',
      style({
        transform: 'translateX(0)',
        opacity: 1,
      })
    ),
    state(
      'out',
      style({
        transform: 'translateX(100%)',
        opacity: 0,
      })
    ),
    transition('in => out', animate('200ms ease-out')),
    transition('out => in', animate('200ms ease-in')),
  ]),
];
