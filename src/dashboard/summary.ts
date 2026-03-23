import { JsonFormatOperations, JsonSnippets, and, count, db, eq } from "astro:db";
import { APP_META } from "../app.meta";

export type JsonFormatterDashboardSummaryV1 = {
  appId: typeof APP_META.key;
  version: 1;
  updatedAt: string;
  totalOperations: number;
  validCount: number;
  invalidCount: number;
  snippetCount: number;
};

const readCount = async (query: Promise<Array<{ value: number }>>) => {
  const [result] = await query;
  return Number(result?.value ?? 0);
};

export const buildJsonFormatterSummary = async (
  userId: string,
): Promise<JsonFormatterDashboardSummaryV1> => {
  const [totalOperations, validCount, invalidCount, snippetCount] = await Promise.all([
    readCount(
      db
        .select({ value: count() })
        .from(JsonFormatOperations)
        .where(eq(JsonFormatOperations.userId, userId)),
    ),
    readCount(
      db
        .select({ value: count() })
        .from(JsonFormatOperations)
        .where(and(eq(JsonFormatOperations.userId, userId), eq(JsonFormatOperations.isValid, true))),
    ),
    readCount(
      db
        .select({ value: count() })
        .from(JsonFormatOperations)
        .where(and(eq(JsonFormatOperations.userId, userId), eq(JsonFormatOperations.isValid, false))),
    ),
    readCount(
      db
        .select({ value: count() })
        .from(JsonSnippets)
        .where(eq(JsonSnippets.userId, userId)),
    ),
  ]);

  return {
    appId: APP_META.key,
    version: 1,
    updatedAt: new Date().toISOString(),
    totalOperations,
    validCount,
    invalidCount,
    snippetCount,
  };
};
