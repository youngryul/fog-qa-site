// 답을 받아 노션 데이터베이스에 저장하는 서버 함수 (Vercel Serverless Function)
// 노션 토큰은 여기 서버 환경 변수에만 있고, 브라우저로는 절대 나가지 않아요.

import crypto from "node:crypto";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// 페이지의 입력칸 id → 노션 데이터베이스 칸 이름
const FIELDS = {
  a1: "Q1 원하는 것",
  a2: "Q2 던져진 조건",
  a3: "Q3 빠져 있는 것",
  a4: "Q4 세인의 편함",
  a5: "Q5 불안",
  a6: "Q6 죽음",
  a7: "Q7 양심의 소리",
  a8: "Q8 다시 붙잡을 것",
  a9: "Q9 던질 가능성",
  a10: "마지막 한 문장",
};
const TITLE = "닉네임";
const KEY_PROP = "작성자 키";
const MAX_FIELD = 6000; // 칸 하나에 저장할 최대 글자 수

const clean = (id) => String(id || "").replace(/-/g, "").toLowerCase();
const hash = (key) => crypto.createHash("sha256").update(key).digest("hex");

// 노션 텍스트는 조각 하나당 2000자 제한이 있어서 나눠서 넣어요.
function richText(value) {
  const text = String(value || "").slice(0, MAX_FIELD);
  const parts = [];
  for (let i = 0; i < text.length; i += 2000) {
    parts.push({ type: "text", text: { content: text.slice(i, i + 2000) } });
  }
  return parts;
}

async function notion(path, method, token, body) {
  const r = await fetch(NOTION_API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.message || `Notion ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST만 받아요." });
  }
  
const token = (String(process.env.NOTION_TOKEN || "").match(/(ntn_|secret_)[A-Za-z0-9]+/) || [])[0];
const dbId = (clean(process.env.NOTION_DATABASE_ID).match(/[0-9a-f]{32}/) || [])[0];
  
  if (!token || !dbId) {
    return res.status(500).json({ error: "서버에 NOTION_TOKEN 또는 NOTION_DATABASE_ID가 설정되지 않았어요." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "요청 형식이 올바르지 않아요." });
  }

  const { pageId, key, answers } = body;
  if (typeof key !== "string" || !/^[a-f0-9]{32,64}$/.test(key)) {
    return res.status(400).json({ error: "작성자 키가 올바르지 않아요." });
  }
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "답이 비어 있어요." });
  }

  const keyHash = hash(key);
  const nickname = String(answers.nick || "").trim().slice(0, 40) || "이름 없음";
  const properties = {
    [TITLE]: { title: [{ type: "text", text: { content: nickname } }] },
    [KEY_PROP]: { rich_text: richText(keyHash) },
  };
  for (const [id, name] of Object.entries(FIELDS)) {
    properties[name] = { rich_text: richText(answers[id]) };
  }

  try {
    if (pageId) {
      // 고치려는 줄이 이 데이터베이스의 것이고, 같은 사람이 쓴 줄인지 확인해요.
      const page = await notion(`/pages/${encodeURIComponent(clean(pageId))}`, "GET", token);
      const parent = clean(page.parent && page.parent.database_id);
      const stored = (page.properties?.[KEY_PROP]?.rich_text || []).map((t) => t.plain_text).join("");
      if (parent !== dbId || page.archived || page.in_trash) {
        return res.status(404).json({ error: "저장된 줄을 찾지 못했어요.", reset: true });
      }
      if (stored !== keyHash) {
        return res.status(403).json({ error: "이 줄을 고칠 권한이 없어요.", reset: true });
      }
      await notion(`/pages/${page.id}`, "PATCH", token, { properties });
      return res.status(200).json({ pageId: page.id });
    }

    const created = await notion("/pages", "POST", token, {
      parent: { database_id: dbId },
      properties,
    });
    return res.status(200).json({ pageId: created.id });
  } catch (e) {
    if (e.status === 404 && pageId) {
      return res.status(404).json({ error: "저장된 줄을 찾지 못했어요.", reset: true });
    }
    if (e.status === 429) {
      return res.status(429).json({ error: "노션이 잠깐 쉬어 가래요. 몇 초 뒤 다시 저장할게요." });
    }
    console.error("Notion error:", e.status, e.message);
    return res.status(502).json({ error: "노션에 저장하지 못했어요." });
  }
}
