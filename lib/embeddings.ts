let extractor: Awaited<ReturnType<typeof import("@xenova/transformers").pipeline>> | null = null;

async function getExtractor() {
  if (!extractor) {
    const { pipeline } = await import("@xenova/transformers");
    extractor = await pipeline("feature-extraction", "Xenova/bge-base-en-v1.5");
  }
  return extractor;
}

export async function embedText(text: string): Promise<number[]> {
  const pipe = await getExtractor();
  const output = await (pipe as any)(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
}
