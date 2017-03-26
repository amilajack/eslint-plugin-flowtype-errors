function test(x: string): boolean {
  return 'string';
}

test(x);

function square(x): number {
  return x * x;
}

function incorrectSquare(x): number {
  return x * 'x';
}
