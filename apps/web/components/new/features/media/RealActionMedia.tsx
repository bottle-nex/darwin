import AgentMessage from "./AgentMessage";

/**
 * Upper section of card 02, "Takes real action".
 *
 * Owns everything shown inside that card's media panel — replace the body with
 * whatever this card should illustrate.
 */
export default function RealActionMedia() {
    return <AgentMessage>{"Tests are green. Opening the pull request."}</AgentMessage>;
}
