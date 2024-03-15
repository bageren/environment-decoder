# environment decoder

Deno package to decode environment variables.

## Usage

Import the `decodeEnvironment` function and call it with an object that defines which decoder to use for each of your environment variables. For example:

```typescript
import {
  decodeEnvironment,
  asBoolean,
  asString,
  asNumber,
  asStringUnion,
} from "https://deno.land/x/environment-decoder";

const myEnv = decodeEnvironment({
  BASE_URL: asString, // myEnv.BASE_URL will have type 'string'
  ENVIRONMENT: asStringUnion("dev", "qa", "prod"), // myEnv.ENVIRONMENT will have type '"dev" | "qa" | "prod"'
  PORT: asNumber, // myEnv.PORT will have type 'number'
  FEATURE_FLAG: asBoolean, // myEnv.FEATURE_FLAG will have type 'boolean'
  WITH_DEFAULT: asString.withDefault("defaultOption"), // use `.withDefault()` to set default values for optional environment variables
  OPTIONAL: asString.optional, // use `.optional` or `.withDefault(undefined)` to allow the environment variable to be undefined
});
```

## Notes

`environment-decoder` will throw an exception when:

- environment variables are not set and not using `.withDefault()`
- environment variables cannot be cast to the requested type (for example, using `asNumber` on `abcde`)
- using `asStringUnion` or `asNumberUnion` and the environment variable is not set to one of the allowed values
