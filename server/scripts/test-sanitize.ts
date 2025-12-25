function sanitizeAIContent(content: string): string {
    if (!content) return '';

    return content
        // Remove complete HTML tags like <span class="font-bold text-white">content</span>
        .replace(/<[^>]*>/g, '')
        // Remove malformed HTML-like content with quotes
        .replace(/"[^"]*">/g, '')
        .replace(/>[^<]*"/g, '')
        // Remove standalone CSS class names that might be left behind
        .replace(/\b(font-bold|font-semibold|font-medium|text-white|text-gray-\d+|text-blue-\d+|text-green-\d+|text-red-\d+|text-yellow-\d+|text-purple-\d+|text-orange-\d+|text-cyan-\d+|bg-\w+[-\w]*)\b/g, '')
        // Remove any remaining quote artifacts
        .replace(/["""]/g, '')
        // Clean up multiple spaces and normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim();
}

const testInput = '<span class="font-bold text-white">Introduction (The Hook):</span>';
console.log('Input:', testInput);
console.log('Output:', sanitizeAIContent(testInput));

const testInput2 = 'Introduction (The Hook):';
console.log('Input 2:', testInput2);
console.log('Output 2:', sanitizeAIContent(testInput2));
