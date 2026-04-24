import { copyFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const dbPath = fileURLToPath(new URL("../data/shops.sqlite", import.meta.url));
const backupPath = `${dbPath}.bak`;

copyFileSync(dbPath, backupPath);

const db = new DatabaseSync(dbPath);

const rows = db.prepare("SELECT rowid, id, raw_json FROM shops ORDER BY rowid").all();
const updateRow = db.prepare("UPDATE shops SET id = ?, raw_json = ? WHERE rowid = ?");

db.exec("BEGIN");

try {
  for (const [index, row] of rows.entries()) {
    const newId = `shop-${String(index + 1).padStart(5, "0")}`;
    let rawJson = row.raw_json;

    try {
      const parsed = JSON.parse(row.raw_json);

      if (parsed && typeof parsed === "object") {
        parsed.id = newId;
        rawJson = JSON.stringify(parsed);
      }
    } catch {
      // Keep the original raw JSON if parsing fails.
    }

    updateRow.run(newId, rawJson, row.rowid);
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

const count = db.prepare("SELECT COUNT(*) AS count FROM shops").get().count;
const first = db.prepare("SELECT id FROM shops ORDER BY rowid LIMIT 1").get()?.id;
const last = db.prepare("SELECT id FROM shops ORDER BY rowid DESC LIMIT 1").get()?.id;

console.log(`Rewrote ${count} shop IDs.`);
console.log(`Backup created at ${backupPath}`);
console.log(`First ID: ${first}`);
console.log(`Last ID: ${last}`);
