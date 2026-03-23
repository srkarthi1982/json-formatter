import { column, defineTable } from "astro:db";

export const JsonSnippets = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    title: column.text(),
    rawJson: column.text(),
    formattedJson: column.text(),
    createdAt: column.text(),
    updatedAt: column.text(),
  },
});

export const JsonFormatOperations = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    inputSize: column.number(),
    outputSize: column.number(),
    operationType: column.text(),
    isValid: column.boolean(),
    errorMessage: column.text({ optional: true }),
    createdAt: column.text(),
  },
});

export const JsonTransformRecipes = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    name: column.text(),
    recipeJson: column.text(),
    createdAt: column.text(),
  },
});

export const jsonFormatterTables = {
  JsonSnippets,
  JsonFormatOperations,
  JsonTransformRecipes,
} as const;
