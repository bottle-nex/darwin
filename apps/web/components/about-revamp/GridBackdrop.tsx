import { gridConfig, specialCells } from "./data";
import GridCell from "./GridCell";

const { columns: COLUMNS, rows: ROWS } = gridConfig;

function pseudoRandom(seed: number) {
    let x = seed ^ 0x9e3779b9;
    x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
    x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
    x = x ^ (x >>> 15);
    return (x >>> 0) / 4294967296;
}

export default function GridBackdrop() {
    const cells = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            const index = row * COLUMNS + col;
            const special = specialCells.find((cell) => cell.row === row && cell.col === col);
            cells.push(
                <GridCell
                    key={index}
                    variant={special?.variant}
                    imageSrc={special?.imageSrc}
                    imageAlt={special?.imageAlt}
                    darker={pseudoRandom(index) > 0.65}
                />,
            );
        }
    }

    return (
        <div
            className="absolute inset-0 grid content-start"
            style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
        >
            {cells}
        </div>
    );
}
