/**
 * JSON Formatter - pretty-print, validate, and transform JSON.
 *
 * Design goals:
 * - Maintain a history of JSON snippets and operations.
 * - Allow saving reusable "transform recipes" (e.g. pick fields).
 */

import { defineTable, column, NOW } from "astro:db";

export const JsonSnippets = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),

    label: column.text({ optional: true }),             // "Webhook payload", "API response"
    rawJson: column.text(),                             // original JSON text
    isValid: column.boolean({ default: true }),
    validationError: column.text({ optional: true }),   // if invalid

    createdAt: column.date({ default: NOW }),
    lastUsedAt: column.date({ optional: true }),
  },
});

export const JsonFormatOperations = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    snippetId: column.text({
      references: () => JsonSnippets.columns.id,
    }),
    userId: column.text(),

    operationType: column.text({ optional: true }),     // "pretty-print", "minify", "sort-keys", "transform"
    settingsJson: column.text({ optional: true }),      // e.g. indent size, sorting settings
    resultJson: column.text({ optional: true }),        // resulting JSON string (if stored)

    createdAt: column.date({ default: NOW }),
  },
});

export const JsonTransformRecipes = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),

    name: column.text(),                                // "Pick keys for logs", "Mask sensitive fields"
    description: column.text({ optional: true }),
    configJson: column.text(),                          // transform DSL/spec as JSON

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const tables = {
  JsonSnippets,
  JsonFormatOperations,
  JsonTransformRecipes,
} as const;
