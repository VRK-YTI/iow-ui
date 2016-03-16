import { isDefined } from './utils';

export interface Comparator<T> {
  (lhs: T, rhs: T): number
}

export interface ChainableComparator<T> extends Comparator<T> {
  andThen(other: Comparator<T>): ChainableComparator<T>;
}

function compare<T>(l: T, r: T, compareValues: (l: T, r: T) => number): number {
  if (isDefined(l) && !isDefined(r)) {
    return 1;
  } else if (!isDefined(l) && isDefined(r)) {
    return -1;
  } else {
    return compareValues(l, r);
  }
}

export function compareStrings(l: string, r: string): number {
  return compare(l, r, (lhs, rhs) => lhs === rhs ? 0 : lhs > rhs ? 1 : -1);
}

export function compareNumbers(l: number, r: number): number {
  return compare(l, r, (lhs, rhs) => lhs === rhs ? 0 : lhs > rhs ? 1 : -1);
}

export function compareBooleans(l: boolean, r: boolean): number {
  return compare(l, r, (lhs, rhs) => lhs === rhs ? 0 : lhs === true ? 1 : -1);
}

export function reversed<T>(comparator: Comparator<T>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => comparator(rhs, lhs));
}

export function comparingString<T>(extractor: (item: T) => string): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => compareStrings(extractor(lhs), extractor(rhs)));
}

export function comparingNumber<T>(extractor: (item: T) => number): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => compareNumbers(extractor(lhs), extractor(rhs)));
}

export function comparingBoolean<T>(extractor: (item: T) => boolean): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => compareBooleans(extractor(lhs), extractor(rhs)));
}

export function makeChainable<T>(comparator: Comparator<T>): ChainableComparator<T> {
  (<any> comparator).andThen = (next: Comparator<T>) => makeChainable(chain(comparator, next));
  return <ChainableComparator<T>> comparator;
}

export function chain<T>(current: Comparator<T>, next: Comparator<T>): Comparator<T> {
  return (lhs: T, rhs: T) => {
    const currentComparison = current(lhs, rhs);
    if (currentComparison !== 0) {
      return currentComparison;
    } else {
      return next(lhs, rhs);
    }
  };
}