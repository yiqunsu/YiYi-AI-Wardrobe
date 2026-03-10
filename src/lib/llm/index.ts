/**
 * Public barrel export for the llm module.
 * Import from "@/lib/llm" to access the clothing analyzer and config utilities.
 */
export { analyzeClothing, type ClothingAnalysisResult } from "./clothing.analyzer";
export { llmConfig, getOpenAIApiKey, getGeminiApiKey } from "./llm.config";
export { CLOTHING_ANALYSIS_PROMPT } from "./llm.prompts";
