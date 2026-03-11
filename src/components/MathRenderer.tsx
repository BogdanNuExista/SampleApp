import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import WebView from 'react-native-webview';

type Props = {
  content: string;
  fontSize?: number;
  textColor?: string;
  mathColor?: string;
};

function buildHtml(
  content: string,
  fontSize: number,
  textColor: string,
  mathColor: string,
): string {
  const json = JSON.stringify(content);
  return `<!DOCTYPE html><html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
    onload="renderContent()"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: transparent;
      color: ${textColor};
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.7;
      overflow: hidden;
      word-break: break-word;
    }
    .katex { color: ${mathColor}; }
    .katex-display { margin: 8px 0; overflow-x: auto; }
    p { margin: 0 0 6px 0; }
    p:last-child { margin-bottom: 0; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    function sendHeight() {
      window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
    }
    function renderContent() {
      var el = document.getElementById('root');
      var raw = ${json};
      /* Convert newlines to paragraph breaks so multi-step solutions render correctly */
      var html = raw
        .split(/\\n/)
        .map(function(line) {
          /* Auto-wrap bare LaTeX lines (no $ delimiters) */
          var trimmed = line.trim();
          if (trimmed.length > 0 && trimmed.indexOf('$') === -1 && /[\\\\^_{}]/.test(trimmed)) {
            return '<p>$' + trimmed + '$</p>';
          }
          return '<p>' + (trimmed || '&nbsp;') + '</p>';
        })
        .join('');
      /* Single-line content: skip the paragraph wrapper */
      if (raw.indexOf('\\n') === -1) {
        if (raw.indexOf('$') === -1 && /[\\\\^_{}]/.test(raw)) {
          el.textContent = '$' + raw + '$';
        } else {
          el.innerHTML = raw;
        }
      } else {
        el.innerHTML = html;
      }
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$',  right: '$',  display: false }
        ],
        macros: {
          '\\\\tg':     '\\\\tan',
          '\\\\ctg':    '\\\\cot',
          '\\\\arctg':  '\\\\arctan',
          '\\\\arcctg': '\\\\operatorname{arccot}'
        },
        throwOnError: false
      });
      /* Measure after render; re-measure once more after fonts settle */
      requestAnimationFrame(function() {
        sendHeight();
        setTimeout(sendHeight, 300);
      });
    }
  </script>
</body>
</html>`;
}

export function MathRenderer({
  content,
  fontSize = 15,
  textColor = '#e2e8f0',
  mathColor = '#fde68a',
}: Props) {
  const [height, setHeight] = useState(40);
  const html = useMemo(
    () => buildHtml(content, fontSize, textColor, mathColor),
    [content, fontSize, textColor, mathColor],
  );

  return (
    <View style={{ height, width: '100%' }}>
      <WebView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        source={{ html }}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={event => {
          const h = Number(event.nativeEvent.data);
          if (h > 0) setHeight(h);
        }}
      />
    </View>
  );
}
