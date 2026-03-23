import { defineDb } from "astro:db";
import { jsonFormatterTables } from "./tables";

export default defineDb({
  tables: jsonFormatterTables,
});
