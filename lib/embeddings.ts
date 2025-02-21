// Local embedding model — no API key, no rate limits, runs in Node.js.
// Model: Xenova/bge-base-en-v1.5
//   - Same BGE model we planned to use, just downloaded and run locally
//   - Downloads ~90MB of model weights on first run, cached after that
//   - Produces 768-dimensional vectors (matches our Supabase VECTOR(768) column)
//   - Used at seed time and at plan-generation time in API routes

let extractor: Awaited<ReturnType<typeof import("@xenova/transformers").pipeline>> | null = null;

async function getExtractor() {
  if (!extractor) {
    const { pipeline } = await import("@xenova/transformers");
    extractor = await pipeline("feature-extraction", "Xenova/bge-base-en-v1.5");
  }
  return extractor;
}

// Converts a string of text into a 768-number vector — its "meaning fingerprint".
export async function embedText(text: string): Promise<number[]> {
  const pipe = await getExtractor();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await (pipe as any)(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
}
