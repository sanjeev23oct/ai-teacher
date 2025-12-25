import React from 'react';

interface FormattedContentProps {
  content: string;
  className?: string;
}

const FormattedContent: React.FC<FormattedContentProps> = ({ content, className = '' }) => {
  // Function to parse and format the content
  const formatContent = (text: string) => {
    // Split content into lines for processing
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let currentSection: React.ReactElement[] = [];
    let sectionKey = 0;

    const flushSection = () => {
      if (currentSection.length > 0) {
        elements.push(
          <div key={`section-${sectionKey++}`} className="mb-6">
            {currentSection}
          </div>
        );
        currentSection = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines but add spacing
      if (!trimmedLine) {
        if (currentSection.length > 0) {
          flushSection();
        }
        return;
      }

      // Main headings (## Title)
      if (trimmedLine.startsWith('## ')) {
        flushSection();
        const title = trimmedLine.replace('## ', '');
        elements.push(
          <div key={`heading-${index}`} className="mb-4">
            <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-400 rounded"></span>
              {title}
            </h3>
          </div>
        );
        return;
      }

      // Sub headings (### Title)
      if (trimmedLine.startsWith('### ')) {
        flushSection();
        const title = trimmedLine.replace('### ', '');
        elements.push(
          <div key={`subheading-${index}`} className="mb-3">
            <h4 className="text-md font-semibold text-green-400 mb-2">
              {title}
            </h4>
          </div>
        );
        return;
      }

      // Numbered lists (1. Item, 2. Item)
      if (/^\d+\.\s/.test(trimmedLine)) {
        const content = trimmedLine.replace(/^\d+\.\s/, '');
        currentSection.push(
          <div key={`numbered-${index}`} className="flex items-start gap-3 mb-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
              {trimmedLine.match(/^(\d+)/)?.[1]}
            </span>
            <span className="text-gray-300 leading-relaxed">{formatInlineText(content)}</span>
          </div>
        );
        return;
      }

      // Bullet points (- Item, • Item)
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        const content = trimmedLine.replace(/^[-•]\s/, '');
        currentSection.push(
          <div key={`bullet-${index}`} className="flex items-start gap-3 mb-2">
            <span className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2"></span>
            <span className="text-gray-300 leading-relaxed">{formatInlineText(content)}</span>
          </div>
        );
        return;
      }

      // Time indicators (10 seconds), (25 seconds)
      if (trimmedLine.match(/\(\d+\s+seconds?\)/)) {
        const timeMatch = trimmedLine.match(/\((\d+)\s+seconds?\)/);
        const timeText = timeMatch ? timeMatch[1] : '';
        const content = trimmedLine.replace(/\(\d+\s+seconds?\)/, '').trim();

        currentSection.push(
          <div key={`timed-${index}`} className="flex items-start gap-3 mb-3 p-3 bg-purple-900/20 rounded-lg border-l-4 border-purple-400">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {timeText}s
              </span>
            </div>
            <span className="text-gray-300 leading-relaxed font-medium">{formatInlineText(content)}</span>
          </div>
        );
        return;
      }

      // Bold text (**text**)
      if (trimmedLine.includes('**')) {
        currentSection.push(
          <p key={`bold-${index}`} className="text-gray-300 leading-relaxed mb-2">
            {formatInlineText(trimmedLine)}
          </p>
        );
        return;
      }

      // Key-value pairs (Key: Value)
      if (trimmedLine.includes(': ') && !trimmedLine.includes('http')) {
        const [key, ...valueParts] = trimmedLine.split(': ');
        const value = valueParts.join(': ');
        currentSection.push(
          <div key={`keyvalue-${index}`} className="flex gap-3 mb-2">
            <span className="font-semibold text-cyan-400 min-w-fit">{formatInlineText(key)}:</span>
            <span className="text-gray-300 leading-relaxed">{formatInlineText(value)}</span>
          </div>
        );
        return;
      }

      // Regular paragraphs
      currentSection.push(
        <p key={`para-${index}`} className="text-gray-300 leading-relaxed mb-2">
          {formatInlineText(trimmedLine)}
        </p>
      );
    });

    // Flush any remaining section
    flushSection();

    return elements;
  };

  // Format inline text (bold, italic, etc.)
  const formatInlineText = (text: string): React.ReactElement => {
    // We need to be careful not to let later regexes match the HTML tags added by earlier ones.
    // A better approach is to use a single pass or placeholders, but for now, 
    // we'll just reorder and refine the regexes.

    let formattedText = text;

    // 1. Handle inline code `code` (do this first as it's most specific)
    formattedText = formattedText.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-800 text-green-400 rounded text-sm font-mono">$1</code>');

    // 2. Handle bold text **text**
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // 3. Handle italic text *text*
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em class="italic text-yellow-300">$1</em>');

    // 4. Handle dates and years (1789, 1815, etc.) - only if not inside a tag
    // This is tricky, but we can look for numbers not preceded by = or "
    formattedText = formattedText.replace(/(?<![="])\b(1[6-9]\d{2}|20\d{2})\b/g, '<span class="font-semibold text-orange-400">$1</span>');

    // 5. Handle important terms in quotes - only if not inside a tag
    // We use a negative lookbehind to ensure we're not matching inside an HTML attribute
    // Note: JS support for negative lookbehind is good in modern browsers
    formattedText = formattedText.replace(/(?<!=)"([^"]+)"/g, '<span class="font-medium text-blue-300">"$1"</span>');

    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  return (
    <div className={`formatted-content ${className}`}>
      {formatContent(content)}
    </div>
  );
};

export default FormattedContent;