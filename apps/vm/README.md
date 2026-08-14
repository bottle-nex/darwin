# vm

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Claude subscription authentication

Authorize once:

```bash
claude setup-token
```

Store the token in the root `.env`:

```dotenv
SERVER_CLAUDE_CODE_OAUTH_TOKEN=your-token
```

The token is injected only into each Claude command and is never baked into the image.
Do not use `--bare`, which ignores subscription OAuth. This mode is for private purchaser
use only; see Anthropic's [authentication](https://code.claude.com/docs/en/team) and
[legal guidance](https://code.claude.com/docs/en/legal-and-compliance).

This project was created using `bun init` in bun v1.3.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
