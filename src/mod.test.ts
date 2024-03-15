import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.211.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.211.0/testing/bdd.ts";
import {
  asBoolean,
  asNumber,
  asNumberUnion,
  asString,
  asStringUnion,
  decodeEnvironment,
} from "./mod.ts";

const decodeEnvironmentWrapper =
  (schema: Parameters<typeof decodeEnvironment>[0]) => () =>
    decodeEnvironment(schema);

describe("environmentDecoder", () => {
  it("should throw error if environment variable contains disallowed value for asStringUnion", () => {
    Deno.env.set("BEER", "Coca Cola");

    assertThrows(
      decodeEnvironmentWrapper({
        BEER: asStringUnion("Budweiser", "Heineken", "Corona"),
      }),
      `Decoder errors: \nBEER: allowed strings are Budweiser, Heineken, Corona, got Coca Cola`
    );
  });

  it("should not throw error if environment variable contains allowed value for asStringUnion", () => {
    Deno.env.set("BEER", "Budweiser");

    decodeEnvironment({
      BEER: asStringUnion("Budweiser", "Heineken", "Corona"),
    });
  });

  it("should throw error if environment variable contains disallowed value for asNumberUnion", () => {
    Deno.env.set("WORLD_WAR", "3");

    assertThrows(
      decodeEnvironmentWrapper({
        WORLD_WAR: asNumberUnion(1, 2),
      }),
      `Decoder errors: \nWORLD_WAR: allowed numbers are 1, 2, got 3`
    );
  });

  it("should not throw error if environment variable contains allowed value for asNumberUnion", () => {
    Deno.env.set("WORLD_WAR", "1");

    decodeEnvironment({
      WORLD_WAR: asNumberUnion(1, 2),
    });
  });

  it("withDefault", () => {
    const env = decodeEnvironment({
      GAME: asString.withDefault("Diablo"),
      MOVIE: asStringUnion("Batman Begins", "Inception").withDefault(
        "Inception"
      ),
      AGE: asNumber.withDefault(1),
      YEAR: asNumberUnion(1994, 2023).withDefault(1994),
      IS_COOL: asBoolean.withDefault(true),
    });

    assertEquals(env.GAME, "Diablo");
    assertEquals(env.MOVIE, "Inception");
    assertEquals(env.AGE, 1);
    assertEquals(env.YEAR, 1994);
    assertEquals(env.IS_COOL, true);
  });

  it("should throw error when environment variable is missing", () => {
    assertThrows(
      decodeEnvironmentWrapper({
        GAME: asString,
        MOVIE: asStringUnion("Batman Begins", "Inception"),
        AGE: asNumber,
        YEAR: asNumberUnion(1994, 2023),
        IS_COOL: asBoolean,
      }),
      "Missing environment variables: \nGAME\nMOVIE\nAGE\nYEAR\nIS_COOL"
    );
  });

  it("should throw error when variable cannot be cast to number for asNumber and asNumberUnion", () => {
    Deno.env.set("AGE", "not a number");
    Deno.env.set("YEAR", "not a number");

    assertThrows(
      decodeEnvironmentWrapper({
        AGE: asNumber,
        YEAR: asNumberUnion(1994, 2023),
      }),
      'Decoder errors: \nAGE: value "not a number" cannot be cast to number\nYEAR: value "not a number" cannot be cast to number'
    );
  });

  it("should throw error when variable is not a valid boolean for asBoolean", () => {
    Deno.env.set("IS_COOL", "not valid");

    assertThrows(
      decodeEnvironmentWrapper({
        IS_COOL: asBoolean,
      }),
      'Decoder errors: \nIS_COOL: value "not valid" cannot be cast to boolean'
    );
  });
});
