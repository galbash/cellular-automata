import Environment from './environment'
import State from './state'

/**
 * the type fo a transition rule
 */
export type transitionRule = (env: Environment) => State
