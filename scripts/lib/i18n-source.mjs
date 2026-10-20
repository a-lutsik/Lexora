import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const HUMAN_ATTRIBUTES = new Set(['aria-label', 'ariaLabel', 'aria-description', 'title', 'placeholder', 'alt', 'label', 'primaryLabel', 'spaceHintText', 'phraseInputLabel']);
const UNCHANGED_COPY = new Set(['Lexora', 'LEXORA', 'gone', 'went', 'apple\nget along\nbe pesky']);
const hasWords = (value) => /\p{L}/u.test(value);
const normalize = (value) => value.replace(/\s+/g, ' ').trim();

/** Collect literal translation calls and reject untranslated JSX copy/attributes. */
export async function inspectSources(root = 'src') {
  const messages = new Set();
  const violations = [];
  const walkDirectory = async (directory) => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!['i18n', 'test'].includes(entry.name)) await walkDirectory(file);
        continue;
      }
      if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) continue;
      const source = await fs.readFile(file, 'utf8');
      const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
      const report = (node, text) => {
        if (!hasWords(text) || UNCHANGED_COPY.has(text)) return;
        const line = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
        violations.push({ file, line, text });
      };
      const visibleExpression = (node) => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) report(node, node.text);
        else if (ts.isTemplateExpression(node)) {
          const literal = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join('');
          report(node, literal);
        } else if (ts.isConditionalExpression(node)) {
          visibleExpression(node.whenTrue);
          visibleExpression(node.whenFalse);
        } else if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
          visibleExpression(node.right);
        }
      };
      const visit = (node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          const sourceArg = ['t', 'tUi'].includes(node.expression.text) ? node.arguments[0]
            : node.expression.text === 'translate' ? node.arguments[1] : undefined;
          if (sourceArg && ts.isStringLiteral(sourceArg)) messages.add(sourceArg.text);
          // These functions own UI error fallback text; backend diagnostics stay data.
          if (['formatIpcError', 'setError', 'setMicError', 'setSaveError', 'setHotkeyError'].includes(node.expression.text)) {
            for (const arg of node.arguments) if (ts.isStringLiteral(arg) && hasWords(arg.text)) messages.add(arg.text);
          }
        }
        if (ts.isPropertyAssignment(node) && node.name.getText(tree) === 'name'
            && ts.isStringLiteral(node.initializer) && ts.isObjectLiteralExpression(node.parent)
            && node.parent.properties.some((property) => property.name?.getText(tree) === 'extensions')) {
          report(node, node.initializer.text);
        }
        if (ts.isJsxText(node)) report(node, normalize(node.text));
        if (ts.isJsxAttribute(node) && HUMAN_ATTRIBUTES.has(node.name.getText(tree)) && node.initializer) {
          if (ts.isStringLiteral(node.initializer)) report(node, node.initializer.text);
          else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
            visibleExpression(node.initializer.expression);
          }
        }
        if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
          visibleExpression(node.expression);
        }
        ts.forEachChild(node, visit);
      };
      visit(tree);
    }
  };
  await walkDirectory(root);
  return { messages, violations };
}
