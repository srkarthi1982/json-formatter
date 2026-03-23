import type { Alpine } from "alpinejs";
import { actions } from "astro:actions";
import { AvBaseStore, safeErrorMessage } from "@ansiversa/components/alpine";
import type { JsonFormatterDashboardSummaryV1 } from "../dashboard/summary";

type OperationType = "format" | "minify" | "validate";

export type JsonSnippet = {
  id: string;
  title: string;
  rawJson: string;
  formattedJson: string;
  createdAt: string;
  updatedAt: string;
};

export type JsonOperation = {
  id: string;
  inputSize: number;
  outputSize: number;
  operationType: OperationType;
  isValid: boolean;
  errorMessage: string | null;
  createdAt: string;
};

type FormatterSeed = {
  rawJson: string;
  formattedJson: string;
  snippets: JsonSnippet[];
  operations: JsonOperation[];
  summary: JsonFormatterDashboardSummaryV1;
};

const DEFAULT_RAW_JSON = `{
  "ansiversa": true,
  "app": "json-formatter",
  "version": 1
}`;

const actionErrorMessage = (result: { error?: { message?: string } } | undefined, fallback: string) => {
  const message = result?.error?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
};

export class JsonStore extends AvBaseStore {
  rawJson = DEFAULT_RAW_JSON;
  formattedJson = "";
  isValid: boolean | null = null;
  errorMessage: string | null = null;
  operationType: OperationType = "format";
  snippets: JsonSnippet[] = [];
  operations: JsonOperation[] = [];
  loading = false;
  activeTab: "formatter" | "snippets" | "history" = "formatter";
  saveDrawerOpen = false;
  snippetTitle = "";
  summary: JsonFormatterDashboardSummaryV1 = {
    appId: "json-formatter",
    version: 1,
    updatedAt: new Date(0).toISOString(),
    totalOperations: 0,
    validCount: 0,
    invalidCount: 0,
    snippetCount: 0,
  };

  seed(data: FormatterSeed) {
    this.rawJson = data.rawJson || DEFAULT_RAW_JSON;
    this.formattedJson = data.formattedJson || "";
    this.snippets = data.snippets ?? [];
    this.operations = data.operations ?? [];
    this.summary = data.summary;
    this.errorMessage = null;
    this.isValid = null;
  }

  setTab(tab: "formatter" | "snippets" | "history") {
    this.activeTab = tab;
  }

  openSaveDrawer() {
    this.saveDrawerOpen = true;
    this.snippetTitle = "";
    this.clearError();
  }

  closeSaveDrawer() {
    this.saveDrawerOpen = false;
    this.snippetTitle = "";
    this.clearError();
  }

  async format() {
    await this.runJsonAction("format", async () => {
      const result = await actions.formatJson(this.payload());
      if (result.error) {
        throw new Error(actionErrorMessage(result, "Unable to format JSON."));
      }
      if (!result.data) {
        throw new Error("Formatting returned no data.");
      }

      this.formattedJson = result.data.formattedJson;
      this.isValid = result.data.isValid;
      this.errorMessage = result.data.errorMessage;
      this.summary = result.data.summary;
      await this.refreshCollections();
      if (result.data.isValid) {
        this.notify("success", "JSON formatted.");
      }
    });
  }

  async minify() {
    await this.runJsonAction("minify", async () => {
      const result = await actions.minifyJson(this.payload());
      if (result.error) {
        throw new Error(actionErrorMessage(result, "Unable to minify JSON."));
      }
      if (!result.data) {
        throw new Error("Minify returned no data.");
      }

      this.formattedJson = result.data.formattedJson;
      this.isValid = result.data.isValid;
      this.errorMessage = result.data.errorMessage;
      this.summary = result.data.summary;
      await this.refreshCollections();
      if (result.data.isValid) {
        this.notify("success", "JSON minified.");
      }
    });
  }

  async validate() {
    await this.runJsonAction("validate", async () => {
      const result = await actions.validateJson(this.payload());
      if (result.error) {
        throw new Error(actionErrorMessage(result, "Unable to validate JSON."));
      }
      if (!result.data) {
        throw new Error("Validation returned no data.");
      }

      this.isValid = result.data.isValid;
      this.errorMessage = result.data.errorMessage;
      this.summary = result.data.summary;
      await this.refreshCollections();
      this.notify(result.data.isValid ? "success" : "error", result.data.isValid ? "JSON is valid." : "JSON is invalid.");
    });
  }

  async saveSnippet() {
    if (!this.formattedJson.trim()) {
      this.setError("Format or minify valid JSON before saving a snippet.");
      return;
    }

    this.loading = true;
    this.clearError();

    try {
      const result = await actions.saveSnippet({
        title: this.snippetTitle.trim(),
        rawJson: this.rawJson,
        formattedJson: this.formattedJson,
      });

      if (result.error) {
        throw new Error(actionErrorMessage(result, "Unable to save snippet."));
      }
      if (!result.data) {
        throw new Error("Snippet save returned no data.");
      }

      this.summary = result.data.summary;
      this.snippets = [result.data.snippet, ...this.snippets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      this.closeSaveDrawer();
      await this.loadSnippets();
      this.notify("success", "Snippet saved.");
    } catch (error) {
      this.setError(safeErrorMessage(error, "Unable to save snippet."));
    } finally {
      this.loading = false;
    }
  }

  async loadSnippets() {
    const result = await actions.listSnippets();
    if (result.data?.snippets) {
      this.snippets = result.data.snippets as JsonSnippet[];
      return;
    }
    if (result.error) {
      throw new Error(actionErrorMessage(result, "Unable to load snippets."));
    }
  }

  async loadOperations() {
    const result = await actions.listOperations();
    if (result.data?.operations) {
      this.operations = result.data.operations as JsonOperation[];
      return;
    }
    if (result.error) {
      throw new Error(actionErrorMessage(result, "Unable to load history."));
    }
  }

  loadSnippet(snippet: JsonSnippet) {
    this.rawJson = snippet.rawJson;
    this.formattedJson = snippet.formattedJson;
    this.isValid = true;
    this.errorMessage = null;
    this.activeTab = "formatter";
  }

  async copyOutput() {
    const content = this.formattedJson.trim() || this.rawJson.trim();
    if (!content) return;
    await navigator.clipboard.writeText(content);
    this.notify("success", "Output copied.");
  }

  validPercent() {
    if (this.summary.totalOperations === 0) return "0%";
    return `${Math.round((this.summary.validCount / this.summary.totalOperations) * 100)}%`;
  }

  private payload() {
    return { rawJson: this.rawJson };
  }

  private async refreshCollections() {
    await Promise.all([this.loadSnippets(), this.loadOperations()]);
  }

  private async runJsonAction(operationType: OperationType, callback: () => Promise<void>) {
    this.loading = true;
    this.operationType = operationType;
    this.clearError();
    this.errorMessage = null;

    try {
      await callback();
    } catch (error) {
      const message = safeErrorMessage(error, "JSON processing failed.");
      this.isValid = false;
      this.errorMessage = message;
      this.setError(message);
      this.notify("error", message);
    } finally {
      this.loading = false;
    }
  }
}

export const registerJsonStore = (Alpine: Alpine) => {
  Alpine.store("json", new JsonStore());
};
