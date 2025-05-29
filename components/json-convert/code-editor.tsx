"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import hljs from "highlight.js/lib/core"
import json from "highlight.js/lib/languages/json"
import typescript from "highlight.js/lib/languages/typescript"
import java from "highlight.js/lib/languages/java"
import dart from "highlight.js/lib/languages/dart"
import swift from "highlight.js/lib/languages/swift"
import go from "highlight.js/lib/languages/go"
import kotlin from "highlight.js/lib/languages/kotlin"
import "highlight.js/styles/github-dark.css"

// Register languages
hljs.registerLanguage("json", json)
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("java", java)
hljs.registerLanguage("dart", dart)
hljs.registerLanguage("swift", swift)
hljs.registerLanguage("go", go)
hljs.registerLanguage("kotlin", kotlin)

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language: string
  placeholder?: string
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, language, placeholder, readOnly = false }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  // Map our language to highlight.js supported languages
  const getHighlightLanguage = (lang: string): string => {
    switch (lang) {
      case "typescript":
        return "typescript";
      case "java":
        return "java";
      case "dart":
      case "flutter":
        return "dart";
      case "swift":
        return "swift";
      case "go":
        return "go";
      case "kotlin":
        return "kotlin";
      case "json":
        return "json";
      default:
        return "typescript";
    }
  };

  // Update highlighted code when value or language changes
  useEffect(() => {
    if (value) {
      try {
        const highlightLanguage = getHighlightLanguage(language);
        const highlighted = hljs.highlight(value, {
          language: highlightLanguage,
        }).value;
        setHighlightedCode(highlighted);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        // Fallback to plain text
        setHighlightedCode(escapeHtml(value));
      }
    } else {
      // Handle empty value
      setHighlightedCode(placeholder || "");
    }
  }, [value, language, placeholder]);

  // Synchronize scrolling between textarea and pre
  useEffect(() => {
    const textarea = textareaRef.current;
    const pre = preRef.current;

    if (!textarea || !pre) return;

    const syncScroll = () => {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener("scroll", syncScroll);
    return () => textarea.removeEventListener("scroll", syncScroll);
  }, []);

  // Handle tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !readOnly) {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;

      // Insert tab at cursor position
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      if (onChange) {
        onChange(newValue);
      }

      // Move cursor after the inserted tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // Get background color based on language
  const getBgColor = () => {
    switch (language) {
      case "json":
        return "bg-slate-950";
      // case "typescript":
      //   return "bg-blue-950";
      // case "java":
      //   return "bg-amber-950";
      // case "dart":
      // case "flutter":
      //   return "bg-emerald-950";
      // case "swift":
      //   return "bg-orange-950";
      // case "go":
      //   return "bg-cyan-950";
      // case "kotlin":
      //   return "bg-purple-950";
      default:
        return "bg-emerald-950";
    }
  };

  if (readOnly) {
    return (
      <div className={`w-full h-full ${getBgColor()} overflow-auto transition-colors duration-200`}>
        <pre className="p-4 m-0 font-mono text-sm text-white">
          <code
            className={`language-${getHighlightLanguage(language)}`}
            dangerouslySetInnerHTML={{
              __html: highlightedCode || placeholder || " ",
            }}
          />
        </pre>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${getBgColor()}  overflow-hidden transition-colors duration-200`}>
      <div className="absolute inset-0 w-full h-full overflow-auto">
        <div className="relative min-h-full">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="absolute inset-0 w-full h-full p-4 font-mono text-sm text-white bg-transparent resize-none focus:outline-none focus:ring-0 overflow-auto caret-white"
            placeholder={placeholder}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            readOnly={readOnly}
            style={{
              caretColor: "white",
              tabSize: 2,
              WebkitTextFillColor: "transparent",
              zIndex: 1,
            }}
          />
          <pre
            ref={preRef}
            className="p-4 m-0 font-mono text-sm text-white pointer-events-none"
            style={{
              tabSize: 2,
              zIndex: 0,
              minHeight: "100%",
            }}
          >
            <code
              className={`language-${getHighlightLanguage(language)}`}
              dangerouslySetInnerHTML={{ __html: highlightedCode || " " }}
            />
            {/* Add an extra line to ensure we can scroll to the bottom */}
            <div className="h-4"></div>
          </pre>
        </div>
      </div>
    </div>
  );
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
