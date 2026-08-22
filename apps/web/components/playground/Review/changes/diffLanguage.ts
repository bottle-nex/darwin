import refractor from "refractor/core";
import bash from "refractor/lang/bash";
import css from "refractor/lang/css";
import go from "refractor/lang/go";
import graphql from "refractor/lang/graphql";
import java from "refractor/lang/java";
import javascript from "refractor/lang/javascript";
import json from "refractor/lang/json";
import jsx from "refractor/lang/jsx";
import markdown from "refractor/lang/markdown";
import markup from "refractor/lang/markup";
import python from "refractor/lang/python";
import ruby from "refractor/lang/ruby";
import rust from "refractor/lang/rust";
import scss from "refractor/lang/scss";
import sql from "refractor/lang/sql";
import tsx from "refractor/lang/tsx";
import typescript from "refractor/lang/typescript";
import yaml from "refractor/lang/yaml";

for (const language of [
    bash,
    css,
    go,
    graphql,
    java,
    javascript,
    json,
    jsx,
    markdown,
    markup,
    python,
    ruby,
    rust,
    scss,
    sql,
    tsx,
    typescript,
    yaml,
]) {
    refractor.register(language);
}

const BY_EXTENSION: Record<string, string> = {
    bash: "bash",
    css: "css",
    go: "go",
    graphql: "graphql",
    gql: "graphql",
    htm: "markup",
    html: "markup",
    java: "java",
    js: "javascript",
    json: "json",
    jsonc: "json",
    jsx: "jsx",
    md: "markdown",
    mdx: "markdown",
    mjs: "javascript",
    cjs: "javascript",
    php: "markup",
    prisma: "graphql",
    py: "python",
    rb: "ruby",
    rs: "rust",
    scss: "scss",
    sh: "bash",
    sql: "sql",
    svg: "markup",
    ts: "typescript",
    tsx: "tsx",
    vue: "markup",
    yaml: "yaml",
    yml: "yaml",
    zsh: "bash",
};

export function languageFor(filename: string): string | null {
    const extension = filename.split(".").pop()?.toLowerCase();
    return (extension && BY_EXTENSION[extension]) ?? null;
}

export { refractor };
