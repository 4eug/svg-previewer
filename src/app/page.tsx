'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Editor } from '@monaco-editor/react';

const defaultSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
  <rect x="10" y="10" width="30" height="30" fill="blue" />
  <path d="M80 80 L90 90 L70 90 Z" fill="green" />
</svg>`;

interface ColorProperty {
  element: string;
  attribute: string;
  value: string;
  index: number;
}

const STORAGE_KEY = 'svg-previewer-state';

export default function Home() {
  const [svgCode, setSvgCode] = useState(defaultSvg);
  const [colorProperties, setColorProperties] = useState<ColorProperty[]>([]);

  // Load saved state from localStorage on initial mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const { svgCode: savedSvgCode, colorProperties: savedColorProperties } = JSON.parse(savedState);
        setSvgCode(savedSvgCode);
        setColorProperties(savedColorProperties);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    } else {
      // If no saved state, initialize with default SVG
      extractColorProperties(defaultSvg);
    }
  }, []);

  // Save state to localStorage whenever svgCode or colorProperties change
  useEffect(() => {
    const stateToSave = {
      svgCode,
      colorProperties,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [svgCode, colorProperties]);

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setSvgCode(value);
      extractColorProperties(value);
    }
  };

  const extractColorProperties = (svg: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const elements = doc.querySelectorAll('*');
    const colors: ColorProperty[] = [];

    elements.forEach((element, elementIndex) => {
      const attributes = element.attributes;
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        if (attr.name === 'fill' || attr.name === 'stroke') {
          colors.push({
            element: element.tagName.toLowerCase(),
            attribute: attr.name,
            value: attr.value,
            index: elementIndex,
          });
        }
      }
    });

    setColorProperties(colors);
  };

  const handleColorChange = (element: string, attribute: string, newColor: string, elementIndex: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgCode, 'image/svg+xml');
    const elements = doc.querySelectorAll('*');
    
    // Find the specific element by index
    const targetElement = elements[elementIndex];
    if (targetElement) {
      targetElement.setAttribute(attribute, newColor);
      const newSvgCode = doc.documentElement.outerHTML;
      setSvgCode(newSvgCode);
      extractColorProperties(newSvgCode);
    }
  };

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">SVG Previewer</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
          <div className="border rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="xml"
              defaultValue={svgCode}
              value={svgCode}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="border rounded-lg p-4 bg-white flex items-center justify-center flex-1">
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: svgCode }}
              />
            </div>
            <div className="border rounded-lg p-4 bg-white">
              <h2 className="text-lg font-semibold mb-4">Color Controls</h2>
              <div className="grid grid-cols-1 gap-4">
                {colorProperties.map((prop, index) => (
                  <div key={`${prop.element}-${prop.index}-${prop.attribute}`} className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {prop.element} {prop.index + 1} ({prop.attribute})
                    </span>
                    <input
                      type="color"
                      value={prop.value}
                      onChange={(e) => handleColorChange(prop.element, prop.attribute, e.target.value, prop.index)}
                      className="w-20 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={prop.value}
                      onChange={(e) => handleColorChange(prop.element, prop.attribute, e.target.value, prop.index)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 