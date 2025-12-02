'use client';

import { useMemo } from 'react';
import type {
  LessonComponent,
  LessonComponentType,
  TextContent,
  HeadingContent,
  ImageContent,
  QuizContent,
} from '@/gen/mirai/v1/ai_generation_pb';
import { TextRenderer } from './TextRenderer';
import { HeadingRenderer } from './HeadingRenderer';
import { ImageRenderer } from './ImageRenderer';
import { QuizRenderer } from './QuizRenderer';

// Component type enum values from proto
const COMPONENT_TYPES = {
  UNSPECIFIED: 0,
  TEXT: 1,
  HEADING: 2,
  IMAGE: 3,
  QUIZ: 4,
} as const;

interface ComponentRendererProps {
  component: LessonComponent;
  isEditing?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (contentJson: string) => void;
  onQuizAnswer?: (componentId: string, optionId: string, isCorrect: boolean) => void;
}

function parseContent<T>(contentJson: string): T | null {
  try {
    return JSON.parse(contentJson) as T;
  } catch {
    return null;
  }
}

function stringifyContent<T>(content: T): string {
  return JSON.stringify(content);
}

export function ComponentRenderer({
  component,
  isEditing = false,
  isSelected = false,
  onSelect,
  onUpdate,
  onQuizAnswer,
}: ComponentRendererProps) {
  const content = useMemo(() => {
    return parseContent(component.contentJson);
  }, [component.contentJson]);

  const handleUpdate = (newContent: unknown) => {
    onUpdate?.(stringifyContent(newContent));
  };

  // Wrapper for selectable/editable state
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (isEditing || onSelect) {
      return (
        <div
          className={`
            relative group
            ${onSelect ? 'cursor-pointer' : ''}
            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}
          `}
          onClick={() => !isEditing && onSelect?.()}
        >
          {/* Edit indicator */}
          {onSelect && !isEditing && (
            <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">
                Click to edit
              </div>
            </div>
          )}
          {children}
        </div>
      );
    }
    return <>{children}</>;
  };

  // Render based on component type
  switch (component.type) {
    case COMPONENT_TYPES.TEXT:
      const textContent = content as TextContent | null;
      if (!textContent) {
        return <div className="p-4 bg-red-50 text-red-700 rounded">Invalid text content</div>;
      }
      return (
        <Wrapper>
          <TextRenderer
            content={textContent}
            isEditing={isEditing}
            onEdit={(c) => handleUpdate(c)}
          />
        </Wrapper>
      );

    case COMPONENT_TYPES.HEADING:
      const headingContent = content as HeadingContent | null;
      if (!headingContent) {
        return <div className="p-4 bg-red-50 text-red-700 rounded">Invalid heading content</div>;
      }
      return (
        <Wrapper>
          <HeadingRenderer
            content={headingContent}
            isEditing={isEditing}
            onEdit={(c) => handleUpdate(c)}
          />
        </Wrapper>
      );

    case COMPONENT_TYPES.IMAGE:
      const imageContent = content as ImageContent | null;
      if (!imageContent) {
        return <div className="p-4 bg-red-50 text-red-700 rounded">Invalid image content</div>;
      }
      return (
        <Wrapper>
          <ImageRenderer
            content={imageContent}
            isEditing={isEditing}
            onEdit={(c) => handleUpdate(c)}
          />
        </Wrapper>
      );

    case COMPONENT_TYPES.QUIZ:
      const quizContent = content as QuizContent | null;
      if (!quizContent) {
        return <div className="p-4 bg-red-50 text-red-700 rounded">Invalid quiz content</div>;
      }
      return (
        <Wrapper>
          <QuizRenderer
            content={quizContent}
            isEditing={isEditing}
            onEdit={(c) => handleUpdate(c)}
            onAnswer={(optionId, isCorrect) => onQuizAnswer?.(component.id, optionId, isCorrect)}
          />
        </Wrapper>
      );

    default:
      return (
        <div className="p-4 bg-gray-100 text-gray-500 rounded">
          Unknown component type: {component.type}
        </div>
      );
  }
}

/**
 * Get the display name for a component type
 */
export function getComponentTypeName(type: LessonComponentType): string {
  const names: Record<number, string> = {
    [COMPONENT_TYPES.UNSPECIFIED]: 'Unknown',
    [COMPONENT_TYPES.TEXT]: 'Text',
    [COMPONENT_TYPES.HEADING]: 'Heading',
    [COMPONENT_TYPES.IMAGE]: 'Image',
    [COMPONENT_TYPES.QUIZ]: 'Quiz',
  };
  return names[type] || 'Unknown';
}

/**
 * Get an icon for a component type
 */
export function getComponentTypeIcon(type: LessonComponentType): string {
  const icons: Record<number, string> = {
    [COMPONENT_TYPES.UNSPECIFIED]: '❓',
    [COMPONENT_TYPES.TEXT]: '📝',
    [COMPONENT_TYPES.HEADING]: '📌',
    [COMPONENT_TYPES.IMAGE]: '🖼️',
    [COMPONENT_TYPES.QUIZ]: '✅',
  };
  return icons[type] || '❓';
}
