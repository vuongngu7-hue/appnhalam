
import React from 'react';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ text, className = "" }) => {
  const renderContent = (rawText: string) => {
    // Basic Markdown Parser logic
    const lines = rawText.split('\n');
    return lines.map((line, index) => {
      let content: React.ReactNode = line;
      let lineClass = "mb-1";

      // Headers
      if (line.startsWith('### ')) {
        content = <h3 className="text-lg font-black text-indigo-600 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      } else if (line.startsWith('## ')) {
        content = <h2 className="text-xl font-black text-slate-800 mt-6 mb-3">{line.replace('## ', '')}</h2>;
      } else if (line.startsWith('# ')) {
        content = <h1 className="text-2xl font-black text-slate-900 mt-8 mb-4">{line.replace('# ', '')}</h1>;
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        content = <div className="flex gap-2 items-start ml-2"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0"></div><span>{line.substring(2)}</span></div>;
      }
      // Bold text with regex
      else {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        content = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-black text-indigo-700">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      }

      return <div key={index} className={lineClass}>{content}</div>;
    });
  };

  return (
    <div className={`markdown-body leading-relaxed ${className}`}>
      {renderContent(text)}
    </div>
  );
};

export default MarkdownText;
