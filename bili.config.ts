import { Config } from 'bili'

const config: Config = {
  plugins: {
    babel: false,
    typescript2: {
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        declaration: false,
      },
    },
  },
  input: 'src/index.ts',
  output: {
    fileName: '[name].[format].js',
    format: 'cjs',
  },
}

export default config
