const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const fs = require("node:fs");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

function promptHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) {
      reject(new Error("Şifreyi gizli girmek için VS Code terminalinde çalıştırın."));
      return;
    }

    stdout.write(prompt);
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
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
        } else if (char >= " ") {
          value += char;
        }
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const username = (await rl.question("Kullanıcı adınızı belirleyin: ")).trim();
  rl.close();

  if (!/^[\p{L}\p{N}._@+-]{1,64}$/u.test(username)) {
    throw new Error("Kullanıcı adı 1-64 karakter olmalı; harf, rakam, nokta, _, @, + veya - içerebilir.");
  }

  const password = await promptHidden("Şifrenizi girin (ekranda görünmez): ");
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Şifre en az 12 karakter olmalı ve UTF-8 olarak 72 baytı aşmamalı.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const jwtSecret = crypto.randomBytes(32).toString("base64url");
  const env = [
    `AUTH_USERNAME=${JSON.stringify(username)}`,
    `AUTH_PASSWORD_HASH=${passwordHash}`,
    `JWT_SECRET=${jwtSecret}`,
    "",
  ].join("\n");

  try {
    fs.writeFileSync(".env", env, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(".env zaten var; mevcut kimlik bilgileri korunmak için değiştirilmedi.");
    }
    throw error;
  }

  console.log("Tek kullanıcı için .env oluşturuldu. Şifre dosyada açık metin olarak tutulmuyor.");
  console.log("Bu dosyayı paylaşmayın veya Git'e eklemeyin.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
