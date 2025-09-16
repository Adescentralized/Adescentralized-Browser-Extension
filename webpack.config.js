const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const sharp = require('sharp');
const fs = require('fs');

// Custom plugin to generate extension icons
class GenerateIconsPlugin {
  constructor(options) {
    this.sourceIcon = options.sourceIcon;
    this.outputDir = options.outputDir;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('GenerateIconsPlugin', async (compilation, callback) => {
      try {
        const iconPath = path.resolve(__dirname, this.sourceIcon);
        const outputPath = path.resolve(__dirname, this.outputDir);
        
        // Check if source icon exists
        if (!fs.existsSync(iconPath)) {
          console.warn(`⚠️  Source icon not found at: ${iconPath}`);
          console.warn('   Creating a default icon...');
          await this.createDefaultIcon(outputPath);
          callback();
          return;
        }

        // Create icons directory if it doesn't exist
        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath, { recursive: true });
        }

        // Generate icons in different sizes
        const sizes = [16, 32, 48, 128];
        
        for (const size of sizes) {
          await sharp(iconPath)
            .resize(size, size)
            .png()
            .toFile(path.join(outputPath, `icon-${size}.png`));
        }
        
        console.log(`✅ Generated extension icons: ${sizes.map(s => `${s}x${s}`).join(', ')}`);
        callback();
      } catch (error) {
        console.error('❌ Error generating icons:', error);
        callback();
      }
    });
  }

  async createDefaultIcon(outputPath) {
    // Create a simple default icon using SVG
    const sizes = [16, 32, 48, 128];
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    for (const size of sizes) {
      const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#1976d2"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="${Math.floor(size * 0.6)}" font-family="Arial">S</text>
      </svg>`;
      
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(outputPath, `icon-${size}.png`));
    }
    
    console.log('✅ Created default icons with "S" logo');
  }
}

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: 'cheap-module-source-map',
  
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/backend-only.ts',
    content: './src/content/index.ts',
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    // Disable eval for Chrome Extension CSP compliance
    devtoolModuleFilenameTemplate: '[resource-path]',
    // Ensure no inline scripts
    crossOriginLoading: false,
    trustedTypes: {
      policyName: 'webpack'
    }
  },
  
  // Use source-map instead of eval for CSP compliance
  devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',

  // Performance settings for extension
  performance: {
    hints: false, // Disable warnings for large bundles in extensions
  },
  
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                noEmit: false,
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/popup/components'),
      '@/pages': path.resolve(__dirname, 'src/popup/pages'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/types': path.resolve(__dirname, 'src/types'),
    },
  },
  
  plugins: [
    new GenerateIconsPlugin({
      sourceIcon: 'public/icon.png', // Put your icon here as 'icon.png'
      outputDir: 'dist/icons',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          globOptions: {
            ignore: ['**/popup.html', '**/icon.png'], // Ignore source icon
          },
        },
        {
          from: 'src/popup/popup.css',
          to: 'popup.css',
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
      inject: 'body', // Explicit injection position
      scriptLoading: 'defer', // Load scripts with defer for CSP compliance
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: false, // Disable inline JS minification
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
  ],
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    // Disable eval for CSP compliance
    concatenateModules: false,
  },
};