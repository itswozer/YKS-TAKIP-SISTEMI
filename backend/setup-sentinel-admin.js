"use strict";

const bcrypt = require("bcryptjs");
const fs = require("node:fs");
const { stdin, stdout } = require("node:process");
const readline = require("node:readline/promises");

function promptHidden(message) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) {
      reject(new Error("Şifreyi gizli girmek için etkileşimli VS Code terminalinde çalıştırın."));
      return;
    }

    stdout.write(message);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("İşlem iptal edildi."));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  const username = (await prompt.question("Sentinel için yeni kullanıcı adını belirleyin: ")).trim();
  prompt.close();

  if (!/^[\p{L}\p{N}._@+-]{1,64}$/u.test(username)) {
    throw new Error("Kullanıcı adı 1-64 karakter olmalı; harf, rakam, nokta, _, @, + veya - içerebilir.");
  }

  const password = await promptHidden("Yeni Sentinel şifresini girin (ekranda görünmez, en az 12 karakter): ");
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Şifre en az 12 karakter olmalı ve UTF-8 olarak 72 baytı aşmamalı.");
  }
  const confirmation = await promptHidden("Yeni Sentinel şifresini tekrar girin: ");
  if (password !== confirmation) throw new Error("Şifreler eşleşmiyor.");

  const passwordHash = await bcrypt.hash(password, 12);
  const contents = [
    `SENTINEL_ADMIN_USERNAME=${JSON.stringify(username)}`,
    `SENTINEL_ADMIN_PASSWORD_HASH=${passwordHash}`,
    "",
  ].join("\n");
  const outputPath = ".sentinel-admin.env";

  try {
    fs.writeFileSync(outputPath, contents, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(".sentinel-admin.env zaten var; mevcut Sentinel kimlik bilgileri korunmak için değiştirilmedi.");
    }
    throw error;
  }

  console.log(`Yalnızca kullanıcı adı ve parola özeti ${outputPath} dosyasına yazıldı.`);
  console.log("Dosyayı açıp iki SENTINEL_ADMIN_* değerini Render Environment'a kopyalayın.");
  console.log("Parola bu dosyaya açık metin olarak kaydedilmedi. Dosyayı paylaşmayın.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
