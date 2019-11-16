import Environment from "./environment";
import State from "./state";

export type transitionRule = (env: Environment) => State;
