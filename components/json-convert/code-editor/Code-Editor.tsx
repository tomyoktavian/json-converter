'use client'
import React, { useState, useEffect } from 'react'
import { CodeiumEditor, CodeiumEditorProps } from "@codeium/react-code-editor";
import "./code-editor.css"

interface CodeEditorProps
  extends Omit<
    CodeiumEditorProps,
    "language" | "value" | "defaultValue" | "onChange" | "height"
  > {
  height?: string;
  value?: string;
  defaultValue?: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  defaultValue = "// Paste your JSON here...",
  language = "json",
  height = "80vh",
  onChange,
  readOnly = false,
  ...props
}) => {
  const editorContainerRef = React.useRef<HTMLDivElement>(null);
  const [code, setCode] = useState(value || defaultValue);

  useEffect(() => {
    setCode(value || defaultValue);
  }, [defaultValue, value]);

  const handleCodeChange = (newValue: string = "") => {
    setCode(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    setTimeout(() => {
      editor?.getAction("editor.action.formatDocument")?.run();
    }, 300);
  };

  useEffect(() => {
    // Mengatur tinggi editor berdasarkan container parent
    const resizeObserver = new ResizeObserver(() => {
      if (editorContainerRef.current) {
        editorContainerRef.current.style.height = "100%";
      }
    });

    const currentRef = editorContainerRef.current;
    if (currentRef) {
      resizeObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        resizeObserver.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={editorContainerRef}
      className="editor-container"
      style={{ height: "100%", minHeight: "300px" }}
    >
      <CodeiumEditor
        theme="vs-dark"
        {...props}
        defaultValue={defaultValue}
        language={language}
        value={code}
        onChange={handleCodeChange}
        onMount={handleEditorMount}
        height="100%"
        options={{
          readOnly,
          folding: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'always',
          foldingHighlight: true,
          minimap: {
            enabled: true,
            showSlider: "always",
            renderCharacters: true,
            maxColumn: 120,
            scale: 1
          },
        }}
      />
    </div>
  );
};

export default CodeEditor
