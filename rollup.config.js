// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'; // Ensure CommonJS modules are correctly converted

export default {
  external: ['react'],
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm',
    sourcemap: true,
    globals: {
      'react': 'React'
    },
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser({
      format: {
        comments: function(node, comment) {
          var text = comment.value;
          var type = comment.type;
          if (type == "comment2") {
            // multiline comment
            return /@preserve|@license|@cc_on|^!|^\*!/i.test(text);
          }
        }
      }
    })
  ]
};
