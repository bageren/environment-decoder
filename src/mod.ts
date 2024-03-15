import { DecodeFn, DecodeOutput, Decoder } from "./types.ts";

// in case the "withDefault" property is missing from the decoder
// it means that a default value has been configured
const isDecoderWithDefault = (decoder: Decoder) => !("withDefault" in decoder);

type DecodeConfig = { [key: string]: DecodeFn<unknown> };

export type Decoded<T> = (T extends DecodeFn<infer O>
  ? [Decoded<O>]
  : T extends DecodeConfig
  ? [{ [key in keyof T]: Decoded<T[key]> }]
  : [T])[0];

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
    throw new Error(
      `Missing environment variable(s): ${missingEnvironmentVariables.join(
        `,`
      )}\n`
    );
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
    throw new Error(
      `Environment decoding error(s): \n${decoderErrors.join(`\n`)}\n`
    );
  }

  return decodedEnvironment;
};
