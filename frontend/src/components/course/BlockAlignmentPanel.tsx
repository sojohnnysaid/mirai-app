'use client';

import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { BlockAlignment, Persona, LearningObjective } from '@/gen/mirai/v1/course_pb';

interface BlockAlignmentPanelProps {
  blockId: string;
  alignment: BlockAlignment | undefined;
  personas: Persona[];
  objectives: LearningObjective[];
  onUpdate: (alignment: Partial<BlockAlignment>) => void;
  onClose: () => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export default function BlockAlignmentPanel({
  blockId,
  alignment,
  personas,
  objectives,
  onUpdate,
  onClose,
  onRegenerate,
  isRegenerating = false,
}: BlockAlignmentPanelProps) {

  // Create mutable copies of the alignment arrays
  const currentPersonas = alignment?.personas ? [...alignment.personas] : [];
  const currentObjectives = alignment?.learningObjectives ? [...alignment.learningObjectives] : [];
  const currentKpis = alignment?.kpis ? [...alignment.kpis] : [];

  const togglePersona = (personaId: string) => {
    const newPersonas = currentPersonas.includes(personaId)
      ? currentPersonas.filter(id => id !== personaId)
      : [...currentPersonas, personaId];

    onUpdate({
      personas: newPersonas,
      learningObjectives: currentObjectives,
      kpis: currentKpis
    });
  };

  const toggleObjective = (objectiveId: string) => {
    const newObjectives = currentObjectives.includes(objectiveId)
      ? currentObjectives.filter(id => id !== objectiveId)
      : [...currentObjectives, objectiveId];

    onUpdate({
      personas: currentPersonas,
      learningObjectives: newObjectives,
      kpis: currentKpis
    });
  };

  return (
    <div className="absolute right-0 top-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900">Block Alignment</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Aligned To Label */}
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Align this content block to specific personas and learning objectives
          </p>
        </div>

        {/* Personas Section */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Target Personas</h5>
          <div className="space-y-2">
            {personas.map((persona) => (
              <label
                key={persona.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={currentPersonas.includes(persona.id)}
                  onChange={() => togglePersona(persona.id)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{persona.role}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Learning Objectives Section */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Learning Objectives</h5>
          <div className="space-y-2">
            {objectives.map((objective, index) => (
              <label
                key={objective.id}
                className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={currentObjectives.includes(objective.id)}
                  onChange={() => toggleObjective(objective.id)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Objective {index + 1}:</span> {objective.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* KPIs Section */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Persona KPIs</h5>
          <div className="space-y-2">
            {personas.map((persona) => {
              const kpiId = `${persona.id}-kpi`;
              return (
                <label
                  key={kpiId}
                  className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentKpis.includes(kpiId)}
                    onChange={() => {
                      const newKpis = currentKpis.includes(kpiId)
                        ? currentKpis.filter(id => id !== kpiId)
                        : [...currentKpis, kpiId];
                      onUpdate({
                        personas: currentPersonas,
                        learningObjectives: currentObjectives,
                        kpis: newKpis
                      });
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{persona.role} KPIs:</span>
                    <span className="block text-xs text-gray-600 mt-1">{persona.kpis}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
          {isRegenerating ? 'Regenerating...' : 'Regenerate Block'}
        </button>
      </div>
    </div>
  );
}