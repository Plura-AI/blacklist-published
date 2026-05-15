export default function handler(req, res) {
  res.status(200).json({
    hasApiKey: !!process.env.BL_PUBLISH_API_KEY,
    keyLength: process.env.BL_PUBLISH_API_KEY ? process.env.BL_PUBLISH_API_KEY.length : 0,
    keyPrefix: process.env.BL_PUBLISH_API_KEY ? process.env.BL_PUBLISH_API_KEY.substring(0, 10) : null,
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    hasGithubOwner: !!process.env.GITHUB_OWNER,
    hasGithubRepo: !!process.env.GITHUB_REPO,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
