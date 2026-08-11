import AgentMessage from "./AgentMessage";

/**
 * Upper section of card 03, "Connects everything".
 *
 * Owns everything shown inside that card's media panel — replace the body with
 * whatever this card should illustrate.
 */
export default function ConnectsEverythingMedia() {
    return <AgentMessage>{"Linked to #231 and the failing CI run."}</AgentMessage>;
}
