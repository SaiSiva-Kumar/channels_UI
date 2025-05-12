const nextConfig = {
    typescript: {
      ignoreBuildErrors: true,
    },
    experimental: {
      missingSuspenseWithCSRBailout: false,
    },
  };
  
module.exports = nextConfig;