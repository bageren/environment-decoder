import { asString } from "./as_string.ts";
import { DecodeFn } from "./types.ts";
import {
  DecodeInput,
  DecoderWithoutDefault,
  PropertiesForDecoderWithoutDefault,
} from "./types.ts";

export const asNumber: DecoderWithoutDefault<number> = Object.assign<
  DecodeFn<number>,
  PropertiesForDecoderWithoutDefault<number>
>(
  (input: DecodeInput) => {
    const inputAsNumber = Number(asString(input));

    if (isNaN(inputAsNumber)) {
      throw `value ${JSON.stringify(input)} cannot be cast to number`;
    }

    return inputAsNumber;
  },
  {
    withDefault: (_default) => (input) => !input ? _default : asNumber(input),
    optional: (input) => (input === undefined ? input : asNumber(input)),
  }
);

export const asNumberUnion = <T extends number>(
  ...allowedNumbers: T[]
): DecoderWithoutDefault<T> =>
  Object.assign<DecodeFn<T>, PropertiesForDecoderWithoutDefault<T>>(
    (input: DecodeInput) => {
      const num = asNumber(input);

      if (allowedNumbers.some((n) => n === num)) {
        return num as T;
      }

      throw `allowed numbers are ${allowedNumbers.join(", ")}, got ${num}`;
    },
    {
      withDefault: (_default) => (input) =>
        !input ? _default : asNumberUnion(...allowedNumbers)(input),
      optional: (input) =>
        input === undefined ? input : asNumberUnion(...allowedNumbers)(input),
    }
  );
