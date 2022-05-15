const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const PUBLIC = path.resolve(__dirname, 'public');

module.exports = (env, options) => {
  const { mode } = options;
  const IS_DEVELOPMENT = mode === 'development';

  clearOutputDir();

  const rules = [
    {
      test: /\.(hbs)$/,
      use: ['raw-loader'],
    },
    {
      test: /\.(sa|sc|c)ss$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
        },
        'css-loader',
        'postcss-loader',
        'sass-loader',
      ],
    },
    {
      test: /\.(png|svg|jpg|jpeg|ico|ttf|webp|eot|woff)(\?.*)?$/,
      type: 'asset/resource',
    },
  ];

  if (!IS_DEVELOPMENT) {
    rules.push({
      test: /\.m?js$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    });
  }

  return {
    stats: 'minimal',
    watchOptions: {
      ignored: [
        '**/node_modules',
        '**/server',
        '**/public',
        '**/tools',
      ],
    },
    mode,
    entry: {
      main: './src/main.js',
    },
    output: {
      path: PUBLIC,
      filename: '[name].min.js',
      chunkFilename: '[name].chunk.js',
      publicPath: '/',
      assetModuleFilename: '[name][ext]',
    },
    module: {
      rules,
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
    ],
    externals: [
      externals(),
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
  };
};

function externals() {
  const IGNORES = [
    'electron',
  ];
  return function ignore({ request }, callback) {
    if (IGNORES.indexOf(request) >= 0) {
      return callback(null, `require('${request}')`);
    }
    return callback();
  };
}

function clearOutputDir() {
  const files = fs.readdirSync(PUBLIC);
  files.forEach((file) => {
    if (file !== 'index.html') {
      const entry = path.join(PUBLIC, file);
      if (fs.statSync(entry).isDirectory()) {
        fs.rmdirSync(entry, { recursive: true });
      } else {
        fs.unlinkSync(entry);
      }
    }
  });
}
