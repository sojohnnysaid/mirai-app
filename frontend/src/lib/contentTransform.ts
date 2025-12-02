/**
 * Content Transformation Utilities
 *
 * Transforms AI-generated lesson content (GeneratedLesson/LessonComponent)
 * to CourseEditor format (CourseContent/CourseBlock).
 *
 * This is the bridge between AI generation output and the course editor.
 */

import {
  type GeneratedLesson,
  type LessonComponent,
  type CourseOutline,
  type OutlineSection,
  type ComponentAlignment,
  LessonComponentType,
} from '@/gen/mirai/v1/ai_generation_pb';

import type {
  CourseBlock,
  CourseSection,
  Lesson,
  BlockAlignment,
  BlockType,
} from '@/schemas/course.schema';
import { BlockType as ProtoBlockType } from '@/gen/mirai/v1/course_pb';

// Content type interfaces matching ComponentRenderer expectations
interface TextContent {
  html: string;
  plaintext: string;
}

interface HeadingContent {
  level: number;
  text: string;
}

interface ImageContent {
  url: string;
  altText: string;
  caption?: string;
}

interface QuizContent {
  question: string;
  questionType: string;
  options: Array<{ id: string; text: string }>;
  correctAnswerId: string;
  explanation: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
}

/**
 * Transform ComponentAlignment (AI format) to BlockAlignment (Editor format)
 */
function transformAlignment(alignment?: ComponentAlignment): BlockAlignment | undefined {
  if (!alignment) return undefined;

  return {
    personas: [], // Will be populated from course context
    learningObjectives: alignment.learningObjectiveIds || [],
    kpis: [], // Not tracked in AI alignment
  };
}

/**
 * Safely parse JSON content from a LessonComponent
 */
function parseContentJson<T>(contentJson: string, defaultValue: T): T {
  try {
    return JSON.parse(contentJson) as T;
  } catch (error) {
    console.error('Failed to parse contentJson:', error);
    return defaultValue;
  }
}

/**
 * Transform a single LessonComponent to a CourseBlock
 */
export function lessonComponentToCourseBlock(
  component: LessonComponent,
  lessonId?: string
): CourseBlock {
  const baseBlock = {
    id: component.id,
    order: component.order,
    alignment: transformAlignment(component.alignment),
  };

  switch (component.type) {
    case LessonComponentType.TEXT: {
      const content = parseContentJson<TextContent>(component.contentJson, {
        html: '',
        plaintext: '',
      });
      return {
        ...baseBlock,
        type: 'text' as BlockType,
        content: content.html || content.plaintext || '',
      };
    }

    case LessonComponentType.HEADING: {
      const content = parseContentJson<HeadingContent>(component.contentJson, {
        level: 2,
        text: '',
      });
      return {
        ...baseBlock,
        type: 'heading' as BlockType,
        content: content.text || '',
      };
    }

    case LessonComponentType.IMAGE: {
      const content = parseContentJson<ImageContent>(component.contentJson, {
        url: '',
        altText: '',
      });
      // Embed image as HTML figure in a text block
      const figureHtml = `<figure class="my-4">
        <img src="${escapeHtml(content.url)}" alt="${escapeHtml(content.altText)}" class="max-w-full rounded-lg" />
        ${content.caption ? `<figcaption class="text-sm text-gray-500 mt-2 text-center">${escapeHtml(content.caption)}</figcaption>` : ''}
      </figure>`;
      return {
        ...baseBlock,
        type: 'text' as BlockType,
        content: figureHtml,
      };
    }

    case LessonComponentType.QUIZ: {
      // Keep quiz content as JSON string for knowledgeCheck block type
      // The content is already in the expected QuizContent format
      return {
        ...baseBlock,
        type: 'knowledgeCheck' as BlockType,
        content: component.contentJson,
      };
    }

    default:
      // Fallback for unknown types
      console.warn(`Unknown component type: ${component.type}`);
      return {
        ...baseBlock,
        type: 'text' as BlockType,
        content: `[Unknown component type: ${component.type}]`,
      };
  }
}

/**
 * Transform a GeneratedLesson to a Lesson (CourseEditor format)
 */
export function generatedLessonToLesson(lesson: GeneratedLesson): Lesson {
  const sortedComponents = [...lesson.components].sort((a, b) => a.order - b.order);

  return {
    id: lesson.id,
    title: lesson.title,
    blocks: sortedComponents.map((comp) => lessonComponentToCourseBlock(comp, lesson.id)),
  };
}

/**
 * Transform multiple GeneratedLessons to CourseContent structure
 *
 * @param lessons - Array of generated lessons from AI
 * @param outline - The approved course outline (for section structure)
 * @returns CourseContent with sections and flattened courseBlocks
 */
export function generatedLessonsToCourseContent(
  lessons: GeneratedLesson[],
  outline: CourseOutline
): { sections: CourseSection[]; courseBlocks: CourseBlock[] } {
  const sections: CourseSection[] = [];
  const allBlocks: CourseBlock[] = [];
  let globalOrder = 0;

  // Group lessons by section from outline
  for (const outlineSection of outline.sections) {
    // Find lessons that belong to this section
    const sectionLessons = lessons.filter((l) => l.sectionId === outlineSection.id);

    // Sort lessons by their outline order
    const outlineLessonIds = outlineSection.lessons.map((ol) => ol.id);
    sectionLessons.sort((a, b) => {
      const aIndex = outlineLessonIds.indexOf(a.outlineLessonId);
      const bIndex = outlineLessonIds.indexOf(b.outlineLessonId);
      return aIndex - bIndex;
    });

    // Transform lessons
    const transformedLessons: Lesson[] = sectionLessons.map((lesson) => {
      const lessonData = generatedLessonToLesson(lesson);

      // Also add to flattened blocks with global ordering and lessonId
      lessonData.blocks?.forEach((block) => {
        allBlocks.push({
          ...block,
          order: globalOrder++,
          lessonId: lesson.id,
        });
      });

      return lessonData;
    });

    sections.push({
      id: outlineSection.id,
      name: outlineSection.title,
      lessons: transformedLessons,
    });
  }

  return { sections, courseBlocks: allBlocks };
}

/**
 * Transform a single regenerated component back to CourseBlock format
 * Used when a component is regenerated via AI
 */
export function transformRegeneratedComponent(
  component: LessonComponent,
  existingBlock: CourseBlock
): CourseBlock {
  const newBlock = lessonComponentToCourseBlock(component);

  // Preserve existing order and alignment if not provided by AI
  return {
    ...newBlock,
    order: existingBlock.order,
    alignment: newBlock.alignment || existingBlock.alignment,
    prompt: existingBlock.prompt, // Preserve the prompt that triggered regeneration
  };
}

/**
 * Helper to escape HTML special characters
 */
function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Validate that quiz content JSON is properly formatted
 */
export function validateQuizContent(contentJson: string): boolean {
  try {
    const content = JSON.parse(contentJson) as QuizContent;
    return !!(
      content.question &&
      content.options &&
      Array.isArray(content.options) &&
      content.options.length >= 2 &&
      content.correctAnswerId
    );
  } catch {
    return false;
  }
}

/**
 * Convert string block type to proto numeric enum value
 */
function blockTypeToProto(type: BlockType): number {
  switch (type) {
    case 'heading':
      return ProtoBlockType.HEADING; // 1
    case 'text':
      return ProtoBlockType.TEXT; // 2
    case 'interactive':
      return ProtoBlockType.INTERACTIVE; // 3
    case 'knowledgeCheck':
      return ProtoBlockType.KNOWLEDGE_CHECK; // 4
    default:
      return ProtoBlockType.UNSPECIFIED; // 0
  }
}

/**
 * Block type for API format (numeric type)
 */
interface ApiBlock {
  id: string;
  type: number;
  content: string;
  prompt?: string;
  order: number;
}

/**
 * Lesson type for API format
 */
interface ApiLesson {
  id: string;
  title: string;
  content?: string;
  blocks?: ApiBlock[];
}

/**
 * Section type for API format
 */
interface ApiSection {
  id: string;
  name: string;
  lessons?: ApiLesson[];
}

/**
 * Convert CourseBlock to API format (with numeric type)
 */
function blockToApiFormat(block: CourseBlock): ApiBlock {
  return {
    id: block.id,
    type: blockTypeToProto(block.type),
    content: block.content,
    prompt: block.prompt,
    order: block.order,
  };
}

/**
 * Convert CourseSection to API format (with numeric block types)
 */
function sectionToApiFormat(section: CourseSection): ApiSection {
  return {
    id: section.id,
    name: section.name,
    lessons: section.lessons?.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      blocks: lesson.blocks?.map(blockToApiFormat),
    })),
  };
}

/**
 * Convert course content to API format for saving
 * Transforms string block types to numeric enum values
 */
export function toApiFormat(content: {
  sections: CourseSection[];
  courseBlocks: CourseBlock[];
}): {
  sections: ApiSection[];
  courseBlocks: ApiBlock[];
} {
  return {
    sections: content.sections.map(sectionToApiFormat),
    courseBlocks: content.courseBlocks.map(blockToApiFormat),
  };
}
