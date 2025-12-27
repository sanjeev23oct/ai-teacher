import React from 'react';
import { Edit3 } from 'lucide-react';
import type { CustomASLTask, Mode } from '../../types/aslTypes';

interface CustomASLTaskFormProps {
  customTask: CustomASLTask;
  setCustomTask: React.Dispatch<React.SetStateAction<CustomASLTask>>;
  onSubmit: (e: React.FormEvent) => void;
  onKeywordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomASLTaskForm: React.FC<CustomASLTaskFormProps> = ({
  customTask,
  setCustomTask,
  onSubmit,
  onKeywordChange
}) => {
  // Common speaking topics to suggest to users
  const commonTopics = [
    { title: "English Tenses", prompt: "Explain the use of present continuous tense with examples" },
    { title: "Speaking Practice", prompt: "Describe your daily routine and explain why it's important" },
    { title: "Speech Practice", prompt: "Give a 2-minute speech about an award ceremony you attended or would like to attend" },
    { title: "Describing Events", prompt: "Describe an award ceremony you know about or would like to attend" },
    { title: "Daily Life", prompt: "Talk about your school and what makes it special" },
    { title: "Hobbies", prompt: "Explain your favorite hobby and why you enjoy it" },
    { title: "Future Goals", prompt: "Describe your career goals and how you plan to achieve them" },
    { title: "Environment", prompt: "Talk about the importance of protecting the environment" }
  ];

  const handleSuggestedTopicClick = (topic: { title: string; prompt: string }) => {
    setCustomTask({
      ...customTask,
      title: topic.title,
      prompt: topic.prompt,
      keywords: topic.title.toLowerCase().split(/\s+/) // Split title into keywords
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Edit3 className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Practice Any Topic</h3>
      </div>
      
      <form onSubmit={onSubmit}>
        <div className="space-y-3">
          {/* Topic Suggestions */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Quick Topics:</label>
            <div className="flex flex-wrap gap-1">
              {commonTopics.slice(0, 4).map((topic, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestedTopicClick(topic)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                >
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Or describe your topic:</label>
            <input
              type="text"
              value={customTask.title}
              onChange={(e) => setCustomTask({...customTask, title: e.target.value})}
              placeholder="e.g., English tenses, speech practice, describing events..."
              className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">What would you like to talk about?</label>
            <textarea
              value={customTask.prompt}
              onChange={(e) => setCustomTask({...customTask, prompt: e.target.value})}
              placeholder="e.g., Help me practice speaking about English tenses, I want to prepare for a speech about an award ceremony..."
              className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm h-16"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Keywords (comma separated, optional)</label>
            <input
              type="text"
              value={customTask.keywords.join(', ')}
              onChange={onKeywordChange}
              placeholder="e.g., present, continuous, tense, examples"
              className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
              <input
                type="number"
                value={customTask.duration}
                onChange={(e) => setCustomTask({...customTask, duration: parseInt(e.target.value) || 60})}
                min="10"
                max="300"
                className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Mode</label>
              <select
                value={customTask.mode}
                onChange={(e) => setCustomTask({...customTask, mode: e.target.value as Mode})}
                className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              >
                <option value="solo">Solo</option>
                <option value="pair">Pair</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-all text-sm"
          >
            Start Practice
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomASLTaskForm;