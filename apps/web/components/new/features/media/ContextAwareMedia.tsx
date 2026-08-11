import AgentMessage from "./AgentMessage";

/**
 * Upper section of card 01, "Always context-aware".
 *
 * Owns everything shown inside that card's media panel — replace the body with
 * whatever this card should illustrate.
 */
export default function ContextAwareMedia() {
    return <AgentMessage>{"I've got your context. No need to repeat."}</AgentMessage>;
}
