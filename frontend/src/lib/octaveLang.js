import { StreamLanguage } from '@codemirror/language'

const keywords = new Set([
  'if', 'else', 'elseif', 'end', 'endif', 'for', 'endfor', 'while',
  'endwhile', 'function', 'endfunction', 'return', 'break', 'continue',
  'switch', 'case', 'otherwise', 'endswitch', 'try', 'catch',
  'end_try_catch', 'do', 'until', 'unwind_protect', 'end_unwind_protect',
  'pkg', 'load',
])

const builtins = new Set([
  'disp', 'fprintf', 'printf', 'zeros', 'ones', 'eye', 'rand', 'randn',
  'size', 'length', 'numel', 'sum', 'prod', 'max', 'min', 'abs', 'sqrt',
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'log2',
  'log10', 'floor', 'ceil', 'round', 'mod', 'rem', 'linspace', 'plot',
  'figure', 'hold', 'grid', 'xlabel', 'ylabel', 'title', 'legend',
  'lqr', 'ss', 'lsim', 'place', 'inv', 'det', 'eig', 'svd', 'norm',
  'cross', 'dot', 'kron', 'num2str', 'str2num', 'strjoin', 'strsplit',
  'strtrim', 'strcmp', 'strcmpi', 'sprintf', 'input', 'true', 'false',
  'pi', 'Inf', 'NaN', 'e',
])

export const octave = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null

    // Comment: % to end of line
    if (stream.eat('%')) {
      stream.skipToEnd()
      return 'comment'
    }

    // Single-quoted string (also used for matrix transpose — simple heuristic)
    if (stream.eat("'")) {
      while (!stream.eol()) {
        if (stream.eat("'")) break
        stream.next()
      }
      return 'string'
    }

    // Double-quoted string
    if (stream.eat('"')) {
      while (!stream.eol()) {
        if (stream.eat('"')) break
        stream.next()
      }
      return 'string'
    }

    // Number (integer, float, scientific, complex)
    if (stream.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?(i|j)?/)) return 'number'

    // Identifier → keyword / builtin / variable
    if (stream.match(/^[a-zA-Z_]\w*/)) {
      const word = stream.current()
      if (keywords.has(word)) return 'keyword'
      if (builtins.has(word)) return 'builtin'
      return 'variableName'
    }

    // Operators and punctuation
    if (stream.match(/^[+\-*\/\\^=<>!&|~.,;:@]/)) return 'operator'

    stream.next()
    return null
  },
})
