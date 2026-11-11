import fs from "node:fs/promises";
await fs.mkdir("assets/fonts", { recursive: true });
for (const [file, url] of [
  [
    "NotoSans-Regular.ttf",
    "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  ],
  [
    "OFL.txt",
    "https://raw.githubusercontent.com/notofonts/noto-fonts/main/LICENSE",
  ],
]) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(file + ": " + r.status);
  await fs.writeFile(
    "assets/fonts/" + file,
    new Uint8Array(await r.arrayBuffer()),
  );
}
console.log("Noto Sans and its license downloaded.");
