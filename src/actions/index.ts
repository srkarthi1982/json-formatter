import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import {
  JsonFormatOperations,
  JsonSnippets,
  JsonTransformRecipes,
  and,
  db,
  eq,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function getOwnedSnippet(snippetId: string, userId: string) {
  const [snippet] = await db
    .select()
    .from(JsonSnippets)
    .where(and(eq(JsonSnippets.id, snippetId), eq(JsonSnippets.userId, userId)));

  if (!snippet) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "JSON snippet not found.",
    });
  }

  return snippet;
}

async function getOwnedRecipe(recipeId: string, userId: string) {
  const [recipe] = await db
    .select()
    .from(JsonTransformRecipes)
    .where(and(eq(JsonTransformRecipes.id, recipeId), eq(JsonTransformRecipes.userId, userId)));

  if (!recipe) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Transform recipe not found.",
    });
  }

  return recipe;
}

export const server = {
  createSnippet: defineAction({
    input: z.object({
      label: z.string().optional(),
      rawJson: z.string().min(1),
      isValid: z.boolean().default(true),
      validationError: z.string().optional(),
      lastUsedAt: z.date().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [snippet] = await db
        .insert(JsonSnippets)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          label: input.label,
          rawJson: input.rawJson,
          isValid: input.isValid,
          validationError: input.validationError,
          createdAt: now,
          lastUsedAt: input.lastUsedAt,
        })
        .returning();

      return { success: true, data: { snippet } };
    },
  }),

  updateSnippet: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        label: z.string().optional(),
        rawJson: z.string().optional(),
        isValid: z.boolean().optional(),
        validationError: z.string().optional(),
        lastUsedAt: z.date().optional(),
      })
      .refine(
        (input) =>
          input.label !== undefined ||
          input.rawJson !== undefined ||
          input.isValid !== undefined ||
          input.validationError !== undefined ||
          input.lastUsedAt !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedSnippet(input.id, user.id);

      const [snippet] = await db
        .update(JsonSnippets)
        .set({
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.rawJson !== undefined ? { rawJson: input.rawJson } : {}),
          ...(input.isValid !== undefined ? { isValid: input.isValid } : {}),
          ...(input.validationError !== undefined ? { validationError: input.validationError } : {}),
          ...(input.lastUsedAt !== undefined ? { lastUsedAt: input.lastUsedAt } : {}),
        })
        .where(eq(JsonSnippets.id, input.id))
        .returning();

      return { success: true, data: { snippet } };
    },
  }),

  listSnippets: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const snippets = await db
        .select()
        .from(JsonSnippets)
        .where(eq(JsonSnippets.userId, user.id));

      return { success: true, data: { items: snippets, total: snippets.length } };
    },
  }),

  createFormatOperation: defineAction({
    input: z.object({
      snippetId: z.string().min(1),
      operationType: z.string().optional(),
      settingsJson: z.string().optional(),
      resultJson: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedSnippet(input.snippetId, user.id);

      const [operation] = await db
        .insert(JsonFormatOperations)
        .values({
          id: crypto.randomUUID(),
          snippetId: input.snippetId,
          userId: user.id,
          operationType: input.operationType,
          settingsJson: input.settingsJson,
          resultJson: input.resultJson,
          createdAt: new Date(),
        })
        .returning();

      return { success: true, data: { operation } };
    },
  }),

  listFormatOperations: defineAction({
    input: z.object({
      snippetId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedSnippet(input.snippetId, user.id);

      const operations = await db
        .select()
        .from(JsonFormatOperations)
        .where(eq(JsonFormatOperations.snippetId, input.snippetId));

      return { success: true, data: { items: operations, total: operations.length } };
    },
  }),

  createTransformRecipe: defineAction({
    input: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      configJson: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [recipe] = await db
        .insert(JsonTransformRecipes)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          name: input.name,
          description: input.description,
          configJson: input.configJson,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return { success: true, data: { recipe } };
    },
  }),

  updateTransformRecipe: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        name: z.string().optional(),
        description: z.string().optional(),
        configJson: z.string().optional(),
      })
      .refine(
        (input) =>
          input.name !== undefined ||
          input.description !== undefined ||
          input.configJson !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedRecipe(input.id, user.id);

      const [recipe] = await db
        .update(JsonTransformRecipes)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.configJson !== undefined ? { configJson: input.configJson } : {}),
          updatedAt: new Date(),
        })
        .where(eq(JsonTransformRecipes.id, input.id))
        .returning();

      return { success: true, data: { recipe } };
    },
  }),

  listTransformRecipes: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const recipes = await db
        .select()
        .from(JsonTransformRecipes)
        .where(eq(JsonTransformRecipes.userId, user.id));

      return { success: true, data: { items: recipes, total: recipes.length } };
    },
  }),
};
