import { ActionError, defineAction } from "astro:actions";
import { JsonFormatOperations, JsonSnippets, db, desc, eq } from "astro:db";
import { z } from "astro:schema";
import { requireUser } from "./_guards";
import { pushJsonFormatterDashboardUpdate } from "../lib/jsonDashboard";

const operationTypes = ["format", "minify", "validate"] as const;

const jsonInputSchema = z.object({
  rawJson: z.string().min(1, "JSON input is required."),
});

const saveSnippetSchema = z.object({
  title: z.string().trim().min(1, "Snippet title is required.").max(120, "Title is too long."),
  rawJson: z.string().min(1, "JSON input is required."),
  formattedJson: z.string().min(1, "Formatted JSON is required."),
});

const byteLength = (value: string) => Buffer.byteLength(value, "utf8");

const serializeJsonError = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Invalid JSON input.";
};

const createOperationRecord = async (params: {
  userId: string;
  operationType: (typeof operationTypes)[number];
  rawJson: string;
  output: string;
  isValid: boolean;
  errorMessage?: string | null;
}) => {
  await db.insert(JsonFormatOperations).values({
    id: crypto.randomUUID(),
    userId: params.userId,
    inputSize: byteLength(params.rawJson),
    outputSize: byteLength(params.output),
    operationType: params.operationType,
    isValid: params.isValid,
    errorMessage: params.errorMessage ?? null,
    createdAt: new Date().toISOString(),
  });
};

const listSnippetsForUser = async (userId: string) => {
  return db
    .select()
    .from(JsonSnippets)
    .where(eq(JsonSnippets.userId, userId))
    .orderBy(desc(JsonSnippets.updatedAt));
};

const listOperationsForUser = async (userId: string) => {
  return db
    .select()
    .from(JsonFormatOperations)
    .where(eq(JsonFormatOperations.userId, userId))
    .orderBy(desc(JsonFormatOperations.createdAt))
    .limit(20);
};

export const jsonActions = {
  formatJson: defineAction({
    accept: "json",
    input: jsonInputSchema,
    handler: async ({ rawJson }, context) => {
      const user = requireUser(context);

      try {
        const formattedJson = JSON.stringify(JSON.parse(rawJson), null, 2);
        await createOperationRecord({
          userId: user.id,
          operationType: "format",
          rawJson,
          output: formattedJson,
          isValid: true,
        });
        const summary = await pushJsonFormatterDashboardUpdate({
          userId: user.id,
          event: "json.formatted",
        });

        return {
          formattedJson,
          isValid: true,
          errorMessage: null,
          inputSize: byteLength(rawJson),
          outputSize: byteLength(formattedJson),
          summary,
        };
      } catch (error) {
        const errorMessage = serializeJsonError(error);
        await createOperationRecord({
          userId: user.id,
          operationType: "format",
          rawJson,
          output: rawJson,
          isValid: false,
          errorMessage,
        });
        const summary = await pushJsonFormatterDashboardUpdate({
          userId: user.id,
          event: "json.format-failed",
        });

        return {
          formattedJson: "",
          isValid: false,
          errorMessage,
          inputSize: byteLength(rawJson),
          outputSize: byteLength(rawJson),
          summary,
        };
      }
    },
  }),

  minifyJson: defineAction({
    accept: "json",
    input: jsonInputSchema,
    handler: async ({ rawJson }, context) => {
      const user = requireUser(context);

      try {
        const minifiedJson = JSON.stringify(JSON.parse(rawJson));
        await createOperationRecord({
          userId: user.id,
          operationType: "minify",
          rawJson,
          output: minifiedJson,
          isValid: true,
        });
        const summary = await pushJsonFormatterDashboardUpdate({
          userId: user.id,
          event: "json.minified",
        });

        return {
          formattedJson: minifiedJson,
          isValid: true,
          errorMessage: null,
          inputSize: byteLength(rawJson),
          outputSize: byteLength(minifiedJson),
          summary,
        };
      } catch (error) {
        const errorMessage = serializeJsonError(error);
        await createOperationRecord({
          userId: user.id,
          operationType: "minify",
          rawJson,
          output: rawJson,
          isValid: false,
          errorMessage,
        });
        const summary = await pushJsonFormatterDashboardUpdate({
          userId: user.id,
          event: "json.minify-failed",
        });

        return {
          formattedJson: "",
          isValid: false,
          errorMessage,
          inputSize: byteLength(rawJson),
          outputSize: byteLength(rawJson),
          summary,
        };
      }
    },
  }),

  validateJson: defineAction({
    accept: "json",
    input: jsonInputSchema,
    handler: async ({ rawJson }, context) => {
      const user = requireUser(context);

      try {
        JSON.parse(rawJson);
        await createOperationRecord({
          userId: user.id,
          operationType: "validate",
          rawJson,
          output: rawJson,
          isValid: true,
        });
        const summary = await pushJsonFormatterDashboardUpdate({
          userId: user.id,
          event: "json.validated",
        });

        return {
          isValid: true,
          errorMessage: null,
          inputSize: byteLength(rawJson),
          outputSize: byteLength(rawJson),
          summary,
        };
      } catch (error) {
        const errorMessage = serializeJsonError(error);
        await createOperationRecord({
          userId: user.id,
          operationType: "validate",
          rawJson,
          output: rawJson,
          isValid: false,
          errorMessage,
        });
        const summary = await pushJsonFormatterDashboardUpdate({
          userId: user.id,
          event: "json.validation-failed",
        });

        return {
          isValid: false,
          errorMessage,
          inputSize: byteLength(rawJson),
          outputSize: byteLength(rawJson),
          summary,
        };
      }
    },
  }),

  saveSnippet: defineAction({
    accept: "json",
    input: saveSnippetSchema,
    handler: async ({ title, rawJson, formattedJson }, context) => {
      const user = requireUser(context);
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      try {
        JSON.parse(rawJson);
      } catch {
        throw new ActionError({ code: "BAD_REQUEST", message: "Only valid JSON snippets can be saved." });
      }

      await db.insert(JsonSnippets).values({
        id,
        userId: user.id,
        title,
        rawJson,
        formattedJson,
        createdAt: now,
        updatedAt: now,
      });

      const summary = await pushJsonFormatterDashboardUpdate({
        userId: user.id,
        event: "snippet.saved",
        entityId: id,
      });

      return {
        snippet: {
          id,
          title,
          rawJson,
          formattedJson,
          createdAt: now,
          updatedAt: now,
        },
        summary,
      };
    },
  }),

  listSnippets: defineAction({
    handler: async (_, context) => {
      const user = requireUser(context);
      const snippets = await listSnippetsForUser(user.id);
      return { snippets };
    },
  }),

  listOperations: defineAction({
    handler: async (_, context) => {
      const user = requireUser(context);
      const operations = await listOperationsForUser(user.id);
      return { operations };
    },
  }),
} as const;
