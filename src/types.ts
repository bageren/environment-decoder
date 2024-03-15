export type DecodeInput = string | undefined;
export type DecodeOutput = string | number | boolean | undefined;
export type DecodeFn<T> = (input: DecodeInput) => T;

export type WithDefaultFn<T> = <D extends T | undefined>(
  _default: D
) => DecodeFn<T | D>;

export type PropertiesForDecoderWithoutDefault<T> = {
  withDefault: WithDefaultFn<T>;
  optional: DecodeFn<T | undefined>;
};
export type DecoderWithoutDefault<T> = DecodeFn<T> &
  PropertiesForDecoderWithoutDefault<T>;
export type DecoderWithDefault<T> = DecodeFn<T>;
export type Decoder =
  | DecoderWithoutDefault<DecodeOutput>
  | DecoderWithDefault<DecodeOutput>;
