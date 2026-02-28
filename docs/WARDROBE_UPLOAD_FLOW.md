# 衣橱上传与处理流程：从 10 张图到数据库

从「用户选 10 张图点确认」到「图片存好 + 元数据 + embedding 进库」的完整执行路径。

---

## 总览（两阶段）

```
用户选图 → 点「Confirm upload」
    ↓
【阶段一】POST /api/wardrobe/upload-batch
    → 每张图：可选「生成产品图」→ 上传到 Storage → 插入 wardrobe_items（metadata=null）
    → 返回 wardrobeItemIds[]
    ↓
【阶段二】POST /api/wardrobe/process-batch
    → 对每个 id：取图 → LLM 分析 → 写 metadata → 做 embedding → 写 wardrobe_item_embeddings
    ↓
前端显示「X item(s) uploaded and analyzed」，列表刷新
```

---

## 阶段一：前端发起上传

**文件：** `src/app/service/wardrobe/page.tsx`

1. 用户选多张图（最多 10 张），点 **Confirm upload**，触发 `confirmBatchUpload`（约 152 行）。
2. 用 `FormData` 把选中的 `file` 全部以 `"files"` 为名 append 进去。
3. **第一次请求**：`POST /api/wardrobe/upload-batch`，`body: formData`，带 `Authorization: Bearer <token>`。
4. 收到 `{ wardrobeItemIds, warnings? }` 后，若 `wardrobeItemIds` 非空，立刻发起**第二次请求**。

```ts
// 166-170 行
const uploadRes = await fetch("/api/wardrobe/upload-batch", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
// 179-202 行：拿到 wardrobeItemIds 后
const processRes = await fetch("/api/wardrobe/process-batch", {
  method: "POST",
  body: JSON.stringify({ wardrobeItemIds }),
  ...
});
```

---

## 阶段一：服务端 upload-batch（存图 + 写 DB，metadata 仍为空）

**文件：** `src/app/api/wardrobe/upload-batch/route.ts`

1. **鉴权**：用 Header 里的 token 建 Supabase 客户端，`getUser(token)`，无用户则 401。
2. **取文件**：`formData.getAll("files")`（或 `"file"`），过滤成 `File[]`，最多 10 个，每个 ≤ 5MB。
3. **对每一张图**（74–106 行循环）：
   - **是否生成产品图**  
     - 若 `ENABLE_PRODUCT_IMAGE_GENERATION !== "true"`：  
       `body = 原图 Buffer`，`ext = 原扩展名`。  
     - 若为 `"true"`：  
       调 `generateProductImage(inputBuffer, file.type)`（Gemini 2.5 Flash Image），得到产品图 Buffer，`ext = "png"`；若 429 等配额错误则降级为原图并记一条 warning。
   - **上传到 Storage**：  
     `path = `${user.id}/${uuid}.${ext}``，  
     `supabase.storage.from("wardrobe-items").upload(path, body, ...)`。
   - **写数据库**：  
     `supabase.from("wardrobe_items").insert({ user_id, name, image_path: path, metadata: null }).select("id").single()`，  
     把返回的 `id` 放进 `wardrobeItemIds`。
4. 返回 `{ wardrobeItemIds }`（若有 warnings 则一起返回）。

此时：**图片已在 Storage，DB 里已有行，但 `metadata` 还是 null。**

---

## 阶段一里的「生成产品图」细节

**文件：** `src/lib/image/generateProductImage.ts`

- 输入：原图 `Buffer` + `mimeType`。
- 使用模型：`llmConfig.geminiImageModel`（默认 `gemini-2.5-flash-image`，Nano Banana）。
- 请求：`contents: [{ text: UPLOAD_CLOTHING_REGENERATE_PROMPT }, { inlineData: { mimeType, data: base64 } }]`。
- 响应：从 `response.candidates[0].content.parts` 里取 `part.inlineData.data`（或兼容 `response.data`），解码成 Buffer 返回。
- 返回的 Buffer 会被 upload-batch 当作「要存的那张图」上传到 Storage，并写入 `wardrobe_items.image_path`。

---

## 阶段二：服务端 process-batch（元数据 + embedding）

**文件：** `src/app/api/wardrobe/process-batch/route.ts`

1. 鉴权同上，拿到 `wardrobeItemIds`（body 里的数组），最多 10 个。
2. 按批（例如每批 10 条）并行执行，对每个 `id` 调用 **`processOneWardrobeItem(supabase, id)`**。
3. 收集 `success` / `failed`，返回 `{ success, failed }`。

---

## 阶段二：单条处理 processOneWardrobeItem

**文件：** `src/lib/wardrobe/processOneWardrobeItem.ts`

对**一个** `wardrobeItemId` 顺序做三件事：

1. **analyzeWardrobeItem(supabase, id)**  
   → 取图 URL，调 LLM，得到「元数据原始结果」。
2. **updateWardrobeMetadata(supabase, id, safe)**  
   → 把校验后的元数据写入 `wardrobe_items.metadata`。
3. **saveWardrobeEmbedding(supabase, id, description)**  
   → 用 metadata 里的 description 做 embedding，写入 `wardrobe_item_embeddings`。

---

### 2.1 取图 + LLM 分析（元数据从哪来）

**文件：** `src/lib/wardrobe/analyzeWardrobeItem.ts`

1. 用 `wardrobeItemId` 查 `wardrobe_items` 的 `image_path`。
2. 用 `image_path` 在 Storage 桶 `wardrobe-items` 上生成 **signed URL**。
3. 调 **`analyzeClothing(imageUrl)`**（`src/lib/llm/analyzeClothing.ts`）：  
   - 请求里把图片（通过 URL 拉取转 base64）和 **CLOTHING_ANALYSIS_PROMPT** 发给 Gemini（如 gemini-2.5-flash-lite）。  
   - 返回结构化 JSON：`category, warmth, formality, description`。  
   - 这就是「后端元数据」的来源，还没写库。

---

### 2.2 把元数据写入数据库

**文件：** `src/lib/wardrobe/updateWardrobeMetadata.ts`

- 对 LLM 返回的 `metadata` 做 `validateMetadata` / `sanitizeMetadata`。
- `supabase.from("wardrobe_items").update({ metadata: safe }).eq("id", wardrobeItemId)`。  
→ **此时这条记录的 `metadata` 才被填上（category、warmth、formality、description 等）。**

---

### 2.3 用 description 做 embedding 并存

**文件：** `src/lib/wardrobe/saveWardrobeEmbedding.ts`

- 从已写入的 metadata 里取出 **description**（`getDescriptionFromMetadata`）。
- 调 **`embed(description)`** 得到向量。
- `supabase.from("wardrobe_item_embeddings").upsert({ wardrobe_item_id, embedding, raw_description }, { onConflict: "wardrobe_item_id" })`。  
→ **用于后续检索/推荐的向量也进库了。**

---

## 数据流小结（10 张图为例）

| 步骤 | 发生位置 | 结果 |
|------|----------|------|
| 1 | 前端 | 10 个 File → FormData → POST upload-batch |
| 2 | upload-batch | 每张图：可选生成产品图 → 1 个文件进 Storage，1 行进 `wardrobe_items`（image_path 有值，metadata=null）→ 得到 10 个 id |
| 3 | 前端 | 拿 10 个 id → POST process-batch |
| 4 | process-batch | 对 10 个 id 并行执行 processOneWardrobeItem |
| 5 | processOne × 10 | 每个：取图 URL → LLM 分析 → 写 metadata → 写 embedding |
| 6 | 前端 | 收到 success/failed，刷新列表（load），用户看到「X item(s) uploaded and analyzed」 |

**最终**：Storage 里 10 张图（可能是产品图或原图），`wardrobe_items` 里 10 行（都有 image_path + metadata），`wardrobe_item_embeddings` 里 10 条向量（用于检索）。

---

## 关键文件索引

| 作用 | 文件 |
|------|------|
| 前端：选图、调 upload-batch 再调 process-batch | `src/app/service/wardrobe/page.tsx`（confirmBatchUpload） |
| 上传 + 可选产品图 + 写 Storage + 插 wardrobe_items | `src/app/api/wardrobe/upload-batch/route.ts` |
| 产品图生成（Nano Banana） | `src/lib/image/generateProductImage.ts` |
| 批量处理：对每个 id 跑 processOne | `src/app/api/wardrobe/process-batch/route.ts` |
| 单条：分析 → 写 metadata → 写 embedding | `src/lib/wardrobe/processOneWardrobeItem.ts` |
| 取图 URL + 调 LLM 分析（元数据来源） | `src/lib/wardrobe/analyzeWardrobeItem.ts`、`src/lib/llm/analyzeClothing.ts` |
| 写 metadata 到 DB | `src/lib/wardrobe/updateWardrobeMetadata.ts` |
| 写 embedding 到 DB | `src/lib/wardrobe/saveWardrobeEmbedding.ts` |
