// src/emit/writeFiles.ts
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";

export async function writeFiles(files: { path: string; contents: string }[]) {
  for (const f of files) {
    await mkdir(dirname(f.path), { recursive: true });
    await writeFile(f.path, f.contents, "utf8");
  }
}
