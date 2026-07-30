const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);


config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];


config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@supabase/auth-js': require.resolve('@supabase/auth-js'),
  '@supabase/supabase-js': require.resolve('@supabase/supabase-js'),
};


config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    mangle: false,
    keep_classnames: true,
    keep_fnames: true,
  },
};

module.exports = config;