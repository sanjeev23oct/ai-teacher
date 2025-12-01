import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
  className?: string;
}

export default function LatexRenderer({ content, className = '' }: LatexRendererProps) {
  // Split content by LaTeX delimiters and render accordingly
  const renderContent = (text: string) => {
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    
    // Match both inline ($...$) and block ($$...$$) LaTeX
    const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add LaTeX content
      if (match[1]) {
        // Block math ($$...$$)
        parts.push(
          <BlockMath key={`block-${match.index}`} math={match[1].trim()} />
        );
      } else if (match[2]) {
        // Inline math ($...$)
        parts.push(
          <InlineMath key={`inline-${match.index}`} math={match[2].trim()} />
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={className}>
      {renderContent(content)}
    </div>
  );
}
