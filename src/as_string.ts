import {
  DecodeInput,
  DecoderWithoutDefault,
  PropertiesForDecoderWithoutDefault,
  DecodeFn,
} from "./types.ts";

export const asString: DecoderWithoutDefault<string> = Object.assign<
  DecodeFn<string>,
  PropertiesForDecoderWithoutDefault<string>
>(
  (input: DecodeInput) => {
    if (input === undefined) {
      throw `environment variable not set`;
    }

    return String(input);
  },
  {
    withDefault: (_default) => (input) => !input ? _default : asString(input),
    optional: (input) => (input === undefined ? input : asString(input)),
  }
);

export const asStringUnion = <T extends string>(
  ...allowedStrings: T[]
): DecoderWithoutDefault<T> =>
  Object.assign<DecodeFn<T>, PropertiesForDecoderWithoutDefault<T>>(
    (input: DecodeInput) => {
      const str = asString(input);

      if (allowedStrings.some((n) => n === str)) {
        return str as T;
      }

      throw `allowed strings are ${allowedStrings.join(", ")}, got ${str}`;
    },
    {
      withDefault: (_default) => (input) =>
        !input ? _default : asStringUnion(...allowedStrings)(input),
      optional: (input) =>
        input === undefined ? input : asStringUnion(...allowedStrings)(input),
    }
  );
