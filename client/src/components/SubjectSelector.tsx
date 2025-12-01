export type Subject = 
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'English'
  | 'Social Studies';

interface SubjectOption {
  id: Subject;
  icon: string;
  color: string;
  label: string;
}

const SUBJECTS: SubjectOption[] = [
  { id: 'Mathematics', icon: '🔢', color: 'bg-blue-500', label: 'Mathematics' },
  { id: 'Physics', icon: '⚛️', color: 'bg-purple-500', label: 'Physics' },
  { id: 'Chemistry', icon: '🧪', color: 'bg-green-500', label: 'Chemistry' },
  { id: 'Biology', icon: '🧬', color: 'bg-teal-500', label: 'Biology' },
  { id: 'English', icon: '📚', color: 'bg-orange-500', label: 'English' },
  { id: 'Social Studies', icon: '🌍', color: 'bg-yellow-500', label: 'Social Studies' },
];

interface SubjectSelectorProps {
  selectedSubject: Subject | null;
  onSelect: (subject: Subject) => void;
}

export default function SubjectSelector({ selectedSubject, onSelect }: SubjectSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-white mb-4">Select Subject</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {SUBJECTS.map((subject) => (
          <button
            key={subject.id}
            onClick={() => onSelect(subject.id)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200
              flex flex-col items-center gap-2
              min-h-[100px] md:min-h-[120px]
              ${
                selectedSubject === subject.id
                  ? `${subject.color} border-white shadow-lg scale-105`
                  : 'bg-surface border-gray-700 hover:border-gray-500 hover:scale-102'
              }
            `}
          >
            <span className="text-4xl">{subject.icon}</span>
            <span className="text-sm md:text-base font-medium text-white text-center">
              {subject.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
