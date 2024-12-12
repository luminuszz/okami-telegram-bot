export class Left<LeftValue, RightValue> {
  constructor(public readonly value: LeftValue) {}

  isRight(): this is Right<LeftValue, RightValue> {
    return false;
  }

  isLeft(): this is Left<LeftValue, RightValue> {
    return true;
  }
}

export class Right<LeftValue, RightValue> {
  constructor(public readonly value: RightValue) {}

  isRight(): this is Right<LeftValue, RightValue> {
    return true;
  }

  isLeft(): this is Left<LeftValue, RightValue> {
    return false;
  }
}

export const left = <LeftValue, RightValue>(
  value: LeftValue,
): Either<LeftValue, RightValue> => new Left(value);

export const right = <LeftValue, RightValue>(
  value: RightValue,
): Either<LeftValue, RightValue> => new Right(value);

export type Either<L, R> = Left<L, R> | Right<L, R>;
