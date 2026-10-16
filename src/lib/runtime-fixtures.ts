type RuntimeFixtureEnv = {
  DEV?: boolean;
  VITE_ENABLE_RUNTIME_FIXTURES?: string;
};

export function evaluateRuntimeFixtureMode(env: RuntimeFixtureEnv) {
  return env.DEV === true && env.VITE_ENABLE_RUNTIME_FIXTURES === "true";
}

export function runtimeFixturesEnabled() {
  return evaluateRuntimeFixtureMode(import.meta.env);
}
