// @flow

const x: any = 2;

const fn = (input): any => {
  return input;
};

fn([
  1,
  // newline break
  2,
]);

// errors are typed "any"
Promise.resolve().catch((err) => {
  if (typeof err === "string") {
    return err;
  }
});
