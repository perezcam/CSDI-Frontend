export function getSourceTypeLabel(sourceType?: string): string | null {
  if (!sourceType) return null;

  const labels: Record<string, string> = {
    corpus: 'Corpus',
    web_cache: 'Web',
  };

  return labels[sourceType] ?? sourceType.replace(/_/g, ' ');
}
