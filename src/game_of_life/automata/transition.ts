import GOLState from "./state";
import GOLEnv from "./environment";

export default function GOLTransition(env: GOLEnv): GOLState {
    let livingNeighbors: number = 0;
    let currentState = env.get(0, 0);
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i == 0 && j == 0) {
                continue;
            }

            if (env.isAccessible(i, j)) {
                let isAlive: boolean = env.get(i, j).alive;
                if (isAlive) {
                    livingNeighbors++;
                }
            }
        }
    }

    let willLive: boolean = (currentState.alive && livingNeighbors == 2) || (livingNeighbors == 3);
    return new GOLState(willLive);
}
