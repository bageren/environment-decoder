import { DecodeFn } from "./types.ts";
import {
  DecoderWithoutDefault,
  DecodeInput,
  PropertiesForDecoderWithoutDefault,
} from "./types.ts";

export const asBoolean: DecoderWithoutDefault<boolean> = Object.assign<
  DecodeFn<boolean>,
  PropertiesForDecoderWithoutDefault<boolean>
>(
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
    withDefault: (_default) => (input) => !input ? _default : asBoolean(input),
    optional: (input) => (input === undefined ? input : asBoolean(input)),
  }
);
