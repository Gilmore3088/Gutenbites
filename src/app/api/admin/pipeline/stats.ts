interface TitleRow {
  id: string;
  title: string;
  status: string;
  error_msg: string | null;
  updated_at: string;
}

interface PipelineStats {
  totalTitles: number;
  counts: Record<string, number>;
  errorCount: number;
  errorTitles: Array<{ id: string; title: string; status: string; error_msg: string | null }>;
}

export function buildPipelineStats(titles: TitleRow[]): PipelineStats {
  const counts: Record<string, number> = {};
  const errorTitles: Array<{ id: string; title: string; status: string; error_msg: string | null }> = [];

  for (const title of titles) {
    counts[title.status] = (counts[title.status] ?? 0) + 1;

    if (title.status.startsWith("error_")) {
      errorTitles.push({
        id: title.id,
        title: title.title,
        status: title.status,
        error_msg: title.error_msg,
      });
    }
  }

  return {
    totalTitles: titles.length,
    counts,
    errorCount: errorTitles.length,
    errorTitles,
  };
}
