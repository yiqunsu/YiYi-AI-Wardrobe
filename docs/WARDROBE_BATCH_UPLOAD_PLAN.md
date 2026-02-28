# Wardrobe 批量上传 + LLM + Embedding + Vector DB 开发计划

## 一、目标流程（你的描述）

1. 用户可多选图片或多次添加，在弹窗中预览待上传列表
2. 用户点击「确定上传」后，后端执行：
   - 把图片存到数据库（及 Storage）
   - 对每张图依次：图片 + prompt → 多模态 LLM → 得到 JSON（metadata）→ 校验格式 → 存 metadata 到 DB
   - 取 metadata 中的 `description` 做 embedding → 得到 vector → 存到 Vector DB

---

## 二、专业审视：需要改进与注意的点

### 2.1 流程顺序

- **建议**：先落库落 Storage（`wardrobe_items` 一行 + 一张图），再对每条记录跑「LLM → 校验 → 更新 metadata → embedding → Vector DB」。
- **原因**：先有 `id` 和 `image_path`，失败重试、前端展示「处理中/已完成」都更好做；且与现有单张上传语义一致（先有 item，再补 metadata）。

### 2.2 同步 vs 异步

- **现状**：多张图时若全部同步跑完再返回，耗时会很长（例如 10 张 × 3s ≈ 30s+），易超时、体验差。
- **建议**：
  - **MVP**：可先做「同步、逐张处理」，限制单次最多 N 张（如 5 张），并设置合理超时。
  - **后续**：改为「上传后立即返回；LLM + embedding 放队列/后台任务」，前端轮询或 WebSocket 查每条状态。这样再支持大批量上传。

### 2.3 Metadata 与 description

- **Prompt**：当前 `CLOTHING_ANALYSIS_PROMPT` 没有要求 `description`。需要在 prompt 里**明确要求**输出一个 `description` 字段（短句描述该衣服，用于检索）。
- **校验**：在 `validators/metadata.ts` 中确保 `description` 为 string 且存在（或允许空字符串，看产品需求）；LLM 返回后先 `validateMetadata` 再落库。

### 2.4 Embedding 与 Vector DB

- **Embedding 模型**：选一种即可（如 OpenAI `text-embedding-3-small`），需在 `lib/llm/config.ts` 或单独 `lib/embedding/config.ts` 里配置。
- **Vector 存哪**：
  - **推荐**：用 **Supabase pgvector**（你已有 Supabase）。新建表如 `wardrobe_item_embeddings (id, wardrobe_item_id, embedding vector(1536), raw_description text)`，或在一张「扩展表」里存 vector，与 `wardrobe_items` 一对一。
  - 这样不引入新服务，RLS 也可复用。
- **何时写 Vector**：在「metadata 校验通过并更新到 `wardrobe_items.metadata`」之后，对 `metadata.description` 调 embedding API，再插入/更新 Vector 表。

### 2.5 错误与部分成功

- **建议**：单张失败（LLM 超时、校验失败、embedding 失败）**不要导致整批失败**。对每张图：能存就存，能更新 metadata 就更新，能写 vector 就写；失败则记下该条（如 `item_id + error`），最后统一返回「成功列表 + 失败列表」。
- 前端可展示：哪些已成功、哪些失败及原因（如「分析失败，可重试」）。

### 2.6 安全与限流

- 限制单次上传数量（如最多 10 张）和单张大小，防止滥用。
- 后端校验：当前用户只能给自己的 `wardrobe_items` 写 metadata 和 embedding。

---

## 三、需要完成的工作清单（按推荐顺序）

### 阶段 0：准备（DB、Prompt、校验）

| 序号 | 工作项 | 说明 |
|------|--------|------|
| 0.1 | **Supabase：wardrobe_items.metadata** | 若尚未有 `metadata jsonb` 列，执行 `ALTER TABLE wardrobe_items ADD COLUMN metadata jsonb;` |
| 0.2 | **Prompt 增加 description** | 在 `lib/llm/prompts.ts` 的 `CLOTHING_ANALYSIS_PROMPT` 中增加：要求输出 `description`（一句话描述该衣服，用于检索），并约定为 string。 |
| 0.3 | **校验器支持 description** | 若需要对 `description` 做必填或格式校验，在 `lib/validators/metadata.ts` 中体现（或保持当前宽松校验，仅保证是 string）。 |

### 阶段 1：Vector DB（Supabase pgvector）

| 序号 | 工作项 | 说明 |
|------|--------|------|
| 1.1 | **启用 pgvector** | 在 Supabase 项目中启用 pgvector 扩展：`create extension if not exists vector;` |
| 1.2 | **建表** | 新建表，例如 `wardrobe_item_embeddings`：`id uuid primary key default gen_random_uuid()`, `wardrobe_item_id uuid not null references wardrobe_items(id) on delete cascade`, `embedding vector(1536)`, `raw_description text`, `created_at timestamptz default now()`；并建索引（如 HNSW）便于之后相似度搜索。 |
| 1.3 | **RLS** | 对该表设 RLS：仅允许用户对自己拥有的 wardrobe_item 读写（通过 `wardrobe_items.user_id = auth.uid()` 关联）。 |

### 阶段 2：Embedding 能力（lib 层）

| 序号 | 工作项 | 说明 |
|------|--------|------|
| 2.1 | **Embedding 配置** | 在 `lib/llm/config.ts` 或新建 `lib/embedding/config.ts` 中配置：embedding 模型名、API key（如 OpenAI）、向量维度。 |
| 2.2 | **embed(text) 函数** | 新建 `lib/embedding/embed.ts`（或放在 `lib/llm/` 下）：接收一段文本，调用 OpenAI Embeddings API，返回 `number[]`。 |
| 2.3 | **写入 Vector 表** | 新建 `lib/wardrobe/saveWardrobeEmbedding.ts`（或类似）：接收 `wardrobe_item_id`、`description`；调 embed → 插入/更新 `wardrobe_item_embeddings`。使用 `supabase/server` 或 `supabase/admin`（视 RLS 需求）。 |

### 阶段 3：单条工作流（LLM → 校验 → 存 metadata → embedding）

| 序号 | 工作项 | 说明 |
|------|--------|------|
| 3.1 | **接入多模态 LLM** | 在 `lib/llm/analyzeClothing.ts` 中实现真实调用（OpenAI vision 或 Claude 等多模态），使用现有 prompt；返回 JSON 字符串，用现有 `parseResponse` 解析。 |
| 3.2 | **单条「分析+存 metadata+embed」** | 新建或扩展 `lib/wardrobe/processOneWardrobeItem.ts`：输入 `wardrobe_item_id`；取图 URL → 调 `analyzeClothing` → `validateMetadata` → 更新 `wardrobe_items.metadata` → 取 `metadata.description` → 调 embedding → 写 `wardrobe_item_embeddings`。错误可抛出或返回错误信息，由上层收集。 |

### 阶段 4：批量上传 API

| 序号 | 工作项 | 说明 |
|------|--------|------|
| 4.1 | **批量上传接口** | 新建 `POST /api/wardrobe/upload-batch`：接收 multipart 多文件（或 base64 数组），校验数量上限与大小；对每张图：上传到 Storage + 插入 `wardrobe_items`（metadata 先为 null）；返回本批次的 `wardrobe_item_id` 列表。 |
| 4.2 | **批量处理接口** | 新建 `POST /api/wardrobe/process-batch`：接收 `{ wardrobeItemIds: string[] }`；对每个 id 依次调用「单条工作流」（LLM → 校验 → 存 metadata → embedding）；收集成功/失败；返回 `{ success: string[], failed: { id, error }[] }`。或与 4.1 合并为「上传后立即处理」的单接口，由你选择。 |

### 阶段 5：前端

| 序号 | 工作项 | 说明 |
|------|--------|------|
| 5.1 | **弹窗 + 待上传列表** | 在 wardrobe 页：选择文件后不立即上传，而是加入「待上传列表」并打开弹窗；支持多选、追加、删除单张；展示缩略图列表。 |
| 5.2 | **确定上传** | 弹窗内「确定上传」：调用批量上传 API（若后端是上传+处理一体，则一次请求；否则先调上传，再调 process-batch）。 |
| 5.3 | **加载与结果** | 上传中显示 loading；返回后根据 success/failed 刷新列表并可选展示失败项及原因。若后续改为异步任务，可增加轮询或 WebSocket 显示每条「处理中/完成/失败」。 |

### 阶段 6：可选优化

| 序号 | 工作项 | 说明 |
|------|--------|------|
| 6.1 | **异步任务** | 上传接口只写 DB+Storage，然后推送任务到队列（或 Vercel 后台函数）；单独 worker 执行 LLM+embedding；前端轮询或 WebSocket 获取每条状态。 |
| 6.2 | **重试与限流** | 对单条 LLM/embedding 失败做重试；对批量接口做 rate limit。 |

---

## 四、推荐实施顺序（与你一步一步做的顺序）

1. **阶段 0**：Prompt 加 description、校验器（如需要）、确认 DB 有 `metadata`。
2. **阶段 1**：pgvector 扩展 + 表 + RLS。
3. **阶段 2**：embedding 配置 + embed 函数 + 写 Vector 表。
4. **阶段 3**：analyzeClothing 接真 LLM + 单条 processOneWardrobeItem。
5. **阶段 4**：upload-batch（及 process-batch 或合并）。
6. **阶段 5**：前端弹窗、待上传列表、确定上传与结果展示。

按上述顺序，我们可以一步一步实现；每完成一块再进入下一块，便于联调与排查问题。
