import Voyage from "../embeddings/embeddings.voyage";
import Store from "../embeddings/embeddings.store";
import Chunker from "../embeddings/embeddings.chunker";

export let voyage: Voyage;
export let store: Store;
export let chunker: Chunker;

export default function Init() {
    voyage = new Voyage();
    store = new Store();
    chunker = new Chunker();
}
