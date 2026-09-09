import { CodeTheme } from "@trydarwin/types";

// Prism tags code with about 30 different token classes. Colouring each one per theme
// would mean 30 values x 9 themes, so they are grouped into these 11 roles instead.
// The grouping itself lives in the `.review-diff .token.*` block in globals.css.
export type CodeTokenRole =
    | "plain"
    | "comment"
    | "punctuation"
    | "operator"
    | "keyword"
    | "string"
    | "number"
    | "function"
    | "className"
    | "property"
    | "variable";

export type CodeThemePreset = {
    label: string;
    colors: Record<CodeTokenRole, string>;
};

// Each role becomes a CSS variable. globals.css reads them; nothing else sets them.
export const CODE_TOKEN_VARS: Record<CodeTokenRole, string> = {
    plain: "--code-plain",
    comment: "--code-comment",
    punctuation: "--code-punctuation",
    operator: "--code-operator",
    keyword: "--code-keyword",
    string: "--code-string",
    number: "--code-number",
    function: "--code-function",
    className: "--code-class-name",
    property: "--code-property",
    variable: "--code-variable",
};

// Darwin is the house theme and keeps the colours the diff had before themes were
// selectable, so nobody sees a change until they pick something else. It is very close
// rather than exact: grouping 30 token classes into 11 roles means booleans and
// SCREAMING_CASE constants now take the number colour instead of their own.
export const CODE_THEME_PRESETS: Record<CodeTheme, CodeThemePreset> = {
    [CodeTheme.Darwin]: {
        label: "Darwin",
        colors: {
            plain: "#e6e6e6",
            comment: "#637777",
            punctuation: "#c792ea",
            operator: "#7fdbca",
            keyword: "#7fdbca",
            string: "#addb67",
            number: "#f78c6c",
            function: "#22b7c7",
            className: "#ffcb8b",
            property: "#80cbc4",
            variable: "#d6deeb",
        },
    },
    [CodeTheme.NightOwl]: {
        label: "Night Owl",
        colors: {
            plain: "#d6deeb",
            comment: "#637777",
            punctuation: "#c792ea",
            operator: "#7fdbca",
            keyword: "#7fdbca",
            string: "#addb67",
            number: "#f78c6c",
            function: "#82aaff",
            className: "#ffcb8b",
            property: "#80cbc4",
            variable: "#d6deeb",
        },
    },
    [CodeTheme.OneDark]: {
        label: "One Dark",
        colors: {
            plain: "#abb2bf",
            comment: "#5c6370",
            punctuation: "#abb2bf",
            operator: "#61afef",
            keyword: "#c678dd",
            string: "#98c379",
            number: "#d19a66",
            function: "#61afef",
            className: "#e5c07b",
            property: "#e06c75",
            variable: "#61afef",
        },
    },
    [CodeTheme.Dracula]: {
        label: "Dracula",
        colors: {
            plain: "#f8f8f2",
            comment: "#6272a4",
            punctuation: "#f8f8f2",
            operator: "#f8f8f2",
            keyword: "#8be9fd",
            string: "#50fa7b",
            number: "#bd93f9",
            function: "#f1fa8c",
            className: "#f1fa8c",
            property: "#ff79c6",
            variable: "#f8f8f2",
        },
    },
    [CodeTheme.Nord]: {
        label: "Nord",
        colors: {
            plain: "#d8dee9",
            comment: "#636f88",
            punctuation: "#81a1c1",
            operator: "#81a1c1",
            keyword: "#81a1c1",
            string: "#a3be8c",
            number: "#b48ead",
            function: "#88c0d0",
            className: "#88c0d0",
            property: "#81a1c1",
            variable: "#81a1c1",
        },
    },
    [CodeTheme.MaterialOceanic]: {
        label: "Material Oceanic",
        colors: {
            plain: "#c3cee3",
            comment: "#546e7a",
            punctuation: "#89ddff",
            operator: "#89ddff",
            keyword: "#c792ea",
            string: "#c3e88d",
            number: "#fd9170",
            function: "#c792ea",
            className: "#ffcb6b",
            property: "#80cbc4",
            variable: "#f07178",
        },
    },
    [CodeTheme.GruvboxDark]: {
        label: "Gruvbox Dark",
        colors: {
            plain: "#ebdbb2",
            comment: "#a89984",
            punctuation: "#a89984",
            operator: "#a89984",
            keyword: "#fb4934",
            string: "#b8bb26",
            number: "#d3869b",
            function: "#fabd2f",
            className: "#fabd2f",
            property: "#fb4934",
            variable: "#fb4934",
        },
    },
    [CodeTheme.VscDarkPlus]: {
        label: "VS Dark+",
        colors: {
            plain: "#d4d4d4",
            comment: "#6a9955",
            punctuation: "#d4d4d4",
            operator: "#d4d4d4",
            keyword: "#569cd6",
            string: "#ce9178",
            number: "#b5cea8",
            function: "#dcdcaa",
            className: "#4ec9b0",
            property: "#9cdcfe",
            variable: "#9cdcfe",
        },
    },
    [CodeTheme.A11yDark]: {
        label: "A11y Dark",
        colors: {
            plain: "#f8f8f2",
            comment: "#d4d0ab",
            punctuation: "#fefefe",
            operator: "#00e0e0",
            keyword: "#00e0e0",
            string: "#abe338",
            number: "#00e0e0",
            function: "#ffd700",
            className: "#ffd700",
            property: "#ffa07a",
            variable: "#00e0e0",
        },
    },
};

export const CODE_THEMES = Object.keys(CODE_THEME_PRESETS) as CodeTheme[];

// Every selectable preset is a dark theme, so a diff rendered on a white page needs
// its own palette rather than a dimmed version of one of them. Agent logs and the
// settings preview deliberately stay dark and keep using the user's chosen preset.
export const LIGHT_CODE_THEME: CodeThemePreset = {
    label: "Darwin Light",
    colors: {
        plain: "#24292f",
        comment: "#6e7781",
        punctuation: "#57606a",
        operator: "#0550ae",
        keyword: "#cf222e",
        string: "#0a3069",
        number: "#0550ae",
        function: "#8250df",
        className: "#953800",
        property: "#116329",
        variable: "#953800",
    },
};

// Falls back instead of indexing straight in: an older browser tab still holding a
// dashboard response from before this column existed would otherwise read `colors`
// off undefined and crash the whole Changes tab.
export function codeThemePreset(theme: CodeTheme | undefined): CodeThemePreset {
    return (theme && CODE_THEME_PRESETS[theme]) ?? CODE_THEME_PRESETS[CodeTheme.Darwin];
}

// Builds the `style` object the diff puts on its root element. Setting the variables
// there lets every token span inherit them without re-rendering the diff itself.
export function codeThemeVars(
    theme: CodeTheme | undefined,
    surface: "dark" | "light" = "dark",
): React.CSSProperties {
    const { colors } = surface === "light" ? LIGHT_CODE_THEME : codeThemePreset(theme);
    const entries = (Object.keys(CODE_TOKEN_VARS) as CodeTokenRole[]).map((role) => [
        CODE_TOKEN_VARS[role],
        colors[role],
    ]);
    return Object.fromEntries(entries) as React.CSSProperties;
}
