/** Joins class names, filtering out falsy values. A tiny `clsx` substitute
 * so we don't pull in an extra dependency for something this small. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
