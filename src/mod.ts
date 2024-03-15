type DecodeInput = string | undefined;
type DecodeOutput = string | number | boolean | undefined;
type DecodeConfig = { [key: string]: DecodeFn<unknown> };
type DecodeFn<T> = (input: DecodeInput) => T;
type DecoderWithoutDefault<T> = DecodeFn<T> & {
  withDefault: <D extends T | undefined>(s: D) => DecodeFn<T | D>;
};
type DecoderWithDefault<T> = DecodeFn<T>;
type Decoder =
  | DecoderWithoutDefault<DecodeOutput>
  | DecoderWithDefault<DecodeOutput>;

export type Decoded<T> = (T extends DecodeFn<infer O>
  ? [Decoded<O>]
  : T extends DecodeConfig
  ? [{ [key in keyof T]: Decoded<T[key]> }]
  : [T])[0];

export const asString: DecoderWithoutDefault<string> = Object.assign(
  (input: DecodeInput) => {
    if (input === undefined) {
      throw `environment variable not set`;
    }

    return String(input);
  },
  {
    withDefault:
      <D extends string | undefined>(_default: D) =>
      (input: DecodeInput) =>
        !input ? _default : asString(input),
  }
);

export const asStringUnion = <T extends string>(
  ...allowedStrings: T[]
): DecoderWithoutDefault<T> =>
  Object.assign(
    (input: DecodeInput) => {
      const str = asString(input);

      if (allowedStrings.some((n) => n === str)) {
        return str as T;
      }

      throw `allowed strings are ${allowedStrings.join(", ")}, got ${str}`;
    },
    {
      withDefault:
        <D extends T | undefined>(_default: D) =>
        (input: DecodeInput) =>
          !input ? _default : asStringUnion(...allowedStrings)(input),
    }
  );

export const asNumber: DecoderWithoutDefault<number> = Object.assign(
  (input: DecodeInput) => {
    const inputAsNumber = Number(asString(input));

    if (isNaN(inputAsNumber)) {
      throw `value ${JSON.stringify(input)} cannot be cast to number`;
    }

    return inputAsNumber;
  },
  {
    withDefault:
      <D extends number | undefined>(_default: D) =>
      (input: DecodeInput) =>
        !input ? _default : asNumber(input),
  }
);

export const asNumberUnion = <T extends number>(
  ...allowedNumbers: T[]
): DecoderWithoutDefault<T> =>
  Object.assign(
    (input: DecodeInput) => {
      const num = asNumber(input);

      if (allowedNumbers.some((n) => n === num)) {
        return num as T;
      }

      throw `allowed numbers are ${allowedNumbers.join(", ")}, got ${num}`;
    },
    {
      withDefault:
        <D extends T | undefined>(_default: D) =>
        (input: DecodeInput) =>
          !input ? _default : asNumberUnion(...allowedNumbers)(input),
    }
  );

export const asBoolean: DecoderWithoutDefault<boolean> = Object.assign(
  (input: DecodeInput) => {
    switch (input) {
      case "0":
      case "false":
        return false;
      case "1":
      case "true":
        return true;
      default:
        throw `value ${JSON.stringify(input)} cannot be cast to boolean`;
    }
  },
  {
    withDefault:
      <D extends boolean | undefined>(_default: D) =>
      (input: DecodeInput) =>
        !input ? _default : asBoolean(input),
  }
);
// in case the "withDefault" property is missing from the decoder
// it means that a default value has been configured
const isDecoderWithDefault = (decoder: Decoder) => !("withDefault" in decoder);

export const decodeEnvironment = <C extends Record<string, Decoder>>(
  config: C
): Decoded<C> => {
  const configEntries = Object.entries(config);

  const missingEnvironmentVariables = configEntries
    .filter(
      ([key, decoder]) => !Deno.env.get(key) && !isDecoderWithDefault(decoder)
    )
    .map(([key]) => key);

  if (missingEnvironmentVariables.length) {
    throw `Missing environment variables: \n${missingEnvironmentVariables.join(
      `\n`
    )}\n`;
  }

  const decoderErrors: string[] = [];

  const decodedEnvironment = configEntries
    .map<[string, ...DecodeOutput[]]>(([envVar, decode]) => {
      try {
        const decodedValue = decode(Deno.env.get(envVar));

        return [envVar, decodedValue];
      } catch (message) {
        decoderErrors.push(`${envVar}: ${message}`);
        return [envVar, undefined];
      }
    })
    .reduce(
      (acc, [envVar, decodedValue]) => ({ ...acc, [envVar]: decodedValue }),
      {}
    );

  if (decoderErrors.length) {
    throw `Decoder errors: \n${decoderErrors.join(`\n`)}\n`;
  }

  return decodedEnvironment;
};
