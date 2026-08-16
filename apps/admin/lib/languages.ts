export interface CodeLanguage {
    value: string;
    label: string;
}

export const CODE_LANGUAGES: CodeLanguage[] = [
    { value: "ts", label: "TypeScript" },
    { value: "tsx", label: "TSX" },
    { value: "js", label: "JavaScript" },
    { value: "jsx", label: "JSX" },
    { value: "json", label: "JSON" },
    { value: "sql", label: "SQL" },
    { value: "bash", label: "Shell" },
    { value: "css", label: "CSS" },
    { value: "html", label: "HTML" },
    { value: "python", label: "Python" },
    { value: "prisma", label: "Prisma" },
];
