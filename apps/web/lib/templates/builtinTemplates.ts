import type { PickableTemplate } from "@/types/issueTemplate";

const REMEMBER = (...extra: string[]): string =>
    [
        "<h2>Remember</h2>",
        '<ul data-type="taskList">',
        ...extra,
        '<li data-type="taskItem" data-checked="false"><p>Add tags so this lands in the right lane</p></li>',
        '<li data-type="taskItem" data-checked="false"><p>Set priority to Urgent only if someone is actually blocked</p></li>',
        '<li data-type="taskItem" data-checked="false"><p>Delete this reminder once you\'re done</p></li>',
        "</ul>",
    ].join("");

export const BUILTIN_ISSUE_TEMPLATES: PickableTemplate[] = [
    {
        id: "builtin:bug",
        name: "Bug report",
        description: [
            '<p><span data-prompt="What is broken? Describe what you saw, not just the symptom"></span></p>',
            "<hr>",

            "<h2>Where</h2>",
            '<p><strong>Area:</strong> <span data-prompt="Which page, screen, or service?"></span></p>',
            '<p><strong>Link:</strong> <span data-prompt="Paste a direct link to it"></span></p>',
            '<p><strong>Who hit it:</strong> <span data-prompt="Everyone, one customer, only you?"></span></p>',
            '<p><strong>Started:</strong> <span data-prompt="When did this last work?"></span></p>',

            "<h2>Steps to reproduce</h2>",
            "<ol>",
            '<li><p><span data-prompt="Go where?"></span></p></li>',
            '<li><p><span data-prompt="Do what?"></span></p></li>',
            '<li><p><span data-prompt="And then what breaks?"></span></p></li>',
            "</ol>",

            "<h2>Expected vs actual</h2>",
            '<p><strong>Expected:</strong> <span data-prompt="What should have happened"></span></p>',
            '<p><strong>Actual:</strong> <span data-prompt="What happened instead"></span></p>',

            "<h2>Evidence</h2>",
            "<p>Paste the real error, not a description of it. Screenshots go here too.</p>",
            "<pre><code>browser / OS:\nbranch or version:\n\nerror:</code></pre>",

            REMEMBER(
                '<li data-type="taskItem" data-checked="false"><p>Cleared your cache and retried? Some bugs go away on their own</p></li>',
                '<li data-type="taskItem" data-checked="false"><p>Searched the board — is this already filed?</p></li>',
            ),
        ].join(""),
    },
    {
        id: "builtin:feature",
        name: "Feature request",
        description: [
            '<p><span data-prompt="What should exist that doesn\'t?"></span></p>',
            "<hr>",

            "<h2>Problem</h2>",
            "<p>Describe the pain, not the solution — the sharper this is, the better the fix.</p>",
            '<p><strong>Who is blocked:</strong> <span data-prompt="Which users, and how many?"></span></p>',
            '<p><strong>What they do today:</strong> <span data-prompt="The workaround they\'re stuck with"></span></p>',
            '<p><strong>What it costs:</strong> <span data-prompt="Lost time, churn, support load?"></span></p>',

            "<h2>Proposed solution</h2>",
            "<p><strong>The change:</strong> <span data-prompt=\"Describe it from the user's side, not the code's\"></span></p>",
            '<p><strong>Out of scope:</strong> <span data-prompt="What this should deliberately not do"></span></p>',

            "<h2>Done when</h2>",
            '<ul data-type="taskList">',
            '<li data-type="taskItem" data-checked="false"><p><span data-prompt="First acceptance criterion"></span></p></li>',
            '<li data-type="taskItem" data-checked="false"><p><span data-prompt="Second acceptance criterion"></span></p></li>',
            "</ul>",

            "<h2>Notes for the agent</h2>",
            "<p>Files, prior art, or constraints worth reading first. Leave blank if you don't know.</p>",

            REMEMBER(),
        ].join(""),
    },
    {
        id: "builtin:chore",
        name: "Refactor / chore",
        description: [
            '<p><span data-prompt="What needs to change, and why is it worth doing now?"></span></p>',
            "<hr>",

            "<h2>The problem</h2>",
            '<p><strong>Where it lives:</strong> <span data-prompt="Which files, module, or service?"></span></p>',
            '<p><strong>What\'s wrong with it:</strong> <span data-prompt="Why is the code as it stands a problem?"></span></p>',
            '<p><strong>What it keeps costing:</strong> <span data-prompt="Bugs it causes, work it slows down"></span></p>',

            "<h2>The change</h2>",
            '<p><strong>Target shape:</strong> <span data-prompt="What should it look like afterwards?"></span></p>',
            "<pre><code>// sketch it here if that's easier than describing it</code></pre>",

            "<h2>Must not change</h2>",
            "<p>Behaviour that has to survive the refactor untouched.</p>",
            '<ul><li><p><span data-prompt="Public behaviour of…"></span></p></li></ul>',

            "<h2>Done when</h2>",
            '<ul data-type="taskList">',
            '<li data-type="taskItem" data-checked="false"><p>Behaviour is unchanged</p></li>',
            '<li data-type="taskItem" data-checked="false"><p>No new lint or type errors</p></li>',
            "</ul>",

            REMEMBER(),
        ].join(""),
    },
];
