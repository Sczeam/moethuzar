type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown> & {
  event: string;
};

function write(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(payload: LogPayload) {
  write("info", payload);
}

export function logWarn(payload: LogPayload) {
  write("warn", payload);
}

export function logError(payload: LogPayload) {
  write("error", payload);
}
