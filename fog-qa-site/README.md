# 흐린 창의 질문들

하이데거 Q&A 웹페이지예요. 누가 답을 적든 **내 노션 데이터베이스 '하이데거 Q&A 답'에 바로 쌓여요.**

```
친구 브라우저 ──(답)──▶ /api/answer (Vercel 서버 함수, 노션 토큰 보관) ──▶ 내 노션 DB
```

- `index.html` — 김 서린 창 디자인 페이지. 닉네임을 적고 답을 쓰면, 2초 쉬었을 때 자동 저장돼요.
- `api/answer.js` — 답을 받아 노션에 한 사람당 한 줄로 저장하는 서버 함수.
- 같은 사람이 답을 고치면 새 줄이 아니라 자기 줄이 고쳐져요. 브라우저마다 '작성자 키'를 만들어서, 남의 줄은 고칠 수 없어요.

---

## 배포하기 (약 30분)

### 1. 노션 Integration 만들기

1. https://www.notion.so/profile/integrations 에 들어가서 **새 API 통합(New integration)** 을 눌러요.
2. 이름은 `흐린 창 Q&A`처럼 정하고, 워크스페이스는 '하이데거 Q&A 답' DB가 있는 곳을 고르고, 유형은 **내부(Internal)** 로 둬요.
3. 만든 뒤 **기능(Capabilities)** 에서 *콘텐츠 읽기 · 업데이트 · 삽입* 이 켜져 있는지 확인해요.
4. **내부 통합 시크릿(Internal Integration Secret)** 을 복사해 둬요. `ntn_`으로 시작해요. 이게 노션 열쇠라서 다른 사람에게 보여주면 안 돼요.

### 2. 데이터베이스에 Integration 연결하기

1. 노션에서 **하이데거 Q&A 답** 데이터베이스 페이지를 열어요.
2. 오른쪽 위 `···` → **연결(Connections)** → 방금 만든 `흐린 창 Q&A`를 추가해요.

이 Integration은 연결한 이 데이터베이스만 볼 수 있어요. 노션의 다른 페이지에는 접근하지 못해요.

### 3. GitHub에 올리기

1. https://github.com/new 에서 새 저장소를 만들어요. 이름은 `fog-qa-site`, **Private** 추천.
2. 저장소 화면의 **uploading an existing file** 을 눌러, 압축을 푼 폴더 안의 파일들을 그대로 끌어다 놓고 **Commit changes** 를 눌러요.
   `index.html`, `package.json`, `api` 폴더(`answer.js`)가 저장소 맨 위에 보이면 돼요.

### 4. Vercel에 배포하기

1. https://vercel.com 에 GitHub 계정으로 가입하거나 로그인해요. 무료(Hobby) 플랜이면 충분해요.
2. **Add New… → Project** → 방금 만든 `fog-qa-site` 저장소를 **Import** 해요.
3. 설정은 그대로 두고, **Environment Variables** 에 두 개를 넣어요.

   | 이름 | 값 |
   | --- | --- |
   | `NOTION_TOKEN` | 1단계에서 복사한 시크릿 |
   | `NOTION_DATABASE_ID` | `efcac3018679426eab29ec6d7eaf25ee` |

4. **Deploy** 를 눌러요. 1분쯤 뒤 `https://fog-qa-site-xxxx.vercel.app` 같은 주소가 생겨요.

### 5. 확인하기

1. 그 주소를 열고 닉네임과 답 하나를 적어요.
2. 닉네임 칸 아래에 **"노션에 저장됨 · 시각"** 이 뜨면 성공이에요.
3. 노션 DB에 내 닉네임으로 한 줄이 생겼는지 보고, 답을 고쳐서 같은 줄이 바뀌는지도 확인해요.
4. 이제 그 주소를 친구들에게 보내면 돼요.

---

## 문제가 생기면

| 페이지에 뜨는 말 | 할 일 |
| --- | --- |
| 서버에 NOTION_TOKEN 또는 NOTION_DATABASE_ID가 설정되지 않았어요 | Vercel → 프로젝트 → Settings → Environment Variables 확인 후 **Redeploy** |
| 노션에 저장하지 못했어요 | 2단계 연결을 빼먹은 경우가 대부분이에요. DB에 Integration이 연결돼 있는지 확인 |
| 저장 버튼만 계속 뜸 | Vercel → 프로젝트 → **Logs** 에서 `Notion error` 줄을 확인 |

## 알아둘 점

- 주소를 아는 사람은 누구나 DB에 줄을 추가할 수 있어요. 친구들에게만 링크를 보내세요.
- 답은 노션 칸마다 최대 6,000자까지 저장돼요.
- 같은 사람이라도 다른 기기나 브라우저에서 열면 새 줄로 저장돼요.
- 노션 DB의 칸 이름을 바꾸면 `api/answer.js` 위쪽 `FIELDS`의 이름도 같이 바꿔야 해요.
- '작성자 키' 칸은 페이지가 자동으로 채우는 확인용이라 고치지 마세요. 표에서 숨겨 두면 깔끔해요.
