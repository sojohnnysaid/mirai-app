'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ImageContent } from '@/gen/mirai/v1/ai_generation_pb';

interface ImageRendererProps {
  content: ImageContent;
  isEditing?: boolean;
  onEdit?: (content: ImageContent) => void;
}

export function ImageRenderer({ content, isEditing = false, onEdit }: ImageRendererProps) {
  const [imageError, setImageError] = useState(false);

  if (isEditing && onEdit) {
    return (
      <div className="border rounded-lg p-4 bg-white space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
          <input
            type="url"
            value={content.url}
            onChange={(e) => {
              setImageError(false);
              onEdit({
                ...content,
                url: e.target.value,
              });
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Alt Text (required for accessibility)</label>
          <input
            type="text"
            value={content.altText}
            onChange={(e) =>
              onEdit({
                ...content,
                altText: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the image..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Caption (optional)</label>
          <input
            type="text"
            value={content.caption || ''}
            onChange={(e) =>
              onEdit({
                ...content,
                caption: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a caption..."
          />
        </div>
        {content.url && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className="relative max-w-md">
              {!imageError ? (
                <img
                  src={content.url}
                  alt={content.altText || 'Preview'}
                  onError={() => setImageError(true)}
                  className="max-w-full h-auto rounded-lg shadow"
                />
              ) : (
                <div className="p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-500">
                  Failed to load image preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!content.url) {
    return (
      <div className="p-8 bg-gray-50 rounded-lg text-center">
        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">No image URL provided</p>
      </div>
    );
  }

  return (
    <figure className="my-4">
      {!imageError ? (
        <div className="relative overflow-hidden rounded-lg shadow-md">
          <img
            src={content.url}
            alt={content.altText}
            onError={() => setImageError(true)}
            className="max-w-full h-auto mx-auto"
          />
        </div>
      ) : (
        <div className="p-8 bg-gray-100 rounded-lg text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Failed to load image</p>
          <p className="text-xs text-gray-400 mt-1">{content.url}</p>
        </div>
      )}
      {content.caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-500 italic">{content.caption}</figcaption>
      )}
    </figure>
  );
}
