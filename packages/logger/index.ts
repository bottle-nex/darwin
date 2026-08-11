import chalk from "chalk";

type Fields = Record<string, string | number | boolean | undefined | null>;

const LEVELS = {
    info: { mark: "·", paint: chalk.blueBright },
    step: { mark: "▸", paint: chalk.cyan },
    success: { mark: "✔", paint: chalk.greenBright },
    warn: { mark: "▲", paint: chalk.yellowBright },
    error: { mark: "✖", paint: chalk.redBright },
} as const;

type Level = keyof typeof LEVELS;

const SCOPE_WIDTH = 12;

function clock(): string {
    return chalk.dim(new Date().toTimeString().slice(0, 8));
}

function scope_tag(scope: string): string {
    const trimmed =
        scope.length > SCOPE_WIDTH ? `…${scope.slice(scope.length - SCOPE_WIDTH + 1)}` : scope;
    return chalk.magenta(trimmed.padEnd(SCOPE_WIDTH));
}

function render_fields(fields?: Fields): string {
    if (!fields) return "";
    const rendered = Object.entries(fields)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => chalk.dim(`${key}=`) + chalk.white(String(value)));
    return rendered.length ? "  " + rendered.join(chalk.dim(" · ")) : "";
}

function indent(text: string): string {
    return text
        .split("\n")
        .map((line) => chalk.dim("  │ ") + line)
        .join("\n");
}

export function format_duration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60_000);
    const seconds = Math.round((ms % 60_000) / 1000);
    return `${minutes}m${seconds}s`;
}

function describe_error(error: unknown): string {
    if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`;
    return String(error);
}

export default class Logger {
    private readonly scope: string;

    private constructor(scope: string) {
        this.scope = scope;
    }

    static scope(scope: string): Logger {
        return new Logger(scope);
    }

    static banner(title: string, fields?: Fields): void {
        console.log(`\n${chalk.bgGreen.black.bold(` ${title} `)}${render_fields(fields)}\n`);
    }

    info(message: string, fields?: Fields): void {
        this.write("info", message, fields);
    }

    step(message: string, fields?: Fields): void {
        this.write("step", message, fields);
    }

    success(message: string, fields?: Fields): void {
        this.write("success", message, fields);
    }

    warn(message: string, fields?: Fields): void {
        this.write("warn", message, fields);
    }

    error(message: string, error?: unknown, fields?: Fields): void {
        this.write("error", message, fields);
        if (error !== undefined) console.error(chalk.red(indent(describe_error(error))));
    }

    block(title: string, body: string): void {
        this.write("info", title);
        console.log(chalk.dim(indent(body)));
    }

    private write(level: Level, message: string, fields?: Fields): void {
        const { mark, paint } = LEVELS[level];
        const line = `${clock()} ${paint(mark)} ${scope_tag(this.scope)} ${paint(message)}${render_fields(fields)}`;
        if (level === "error") console.error(line);
        else console.log(line);
    }
}
