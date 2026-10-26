import { createHash } from "node:crypto";

const maxDnsLabelLength = 63;
const hashLength = 4;

// Copies generatePreviewAlias from wrangler's src/versions/upload.ts, which
// names the branch preview of each worker on Workers Builds.
function getPreviewAlias({
  branch,
  workerName,
}: {
  branch: string;
  workerName: string;
}) {
  const alias = branch
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  if (!/^[a-z](?:[a-z0-9-]*[a-z0-9])?$/.test(alias)) {
    return undefined;
  }
  const availableSpace = maxDnsLabelLength - workerName.length - 1;
  if (alias.length <= availableSpace) {
    return alias;
  }
  const maxPrefixLength = availableSpace - hashLength - 1;
  if (maxPrefixLength < 1) {
    return undefined;
  }
  const hash = createHash("sha256")
    .update(branch)
    .digest("hex")
    .slice(0, hashLength);
  return `${alias.slice(0, maxPrefixLength)}-${hash}`;
}

export function getApiPreviewUrl({
  apiPreviewHost,
  branch,
  deployEnv,
}: {
  apiPreviewHost: string | undefined;
  branch: string;
  deployEnv: string | undefined;
}) {
  if (deployEnv !== "preview" || !apiPreviewHost) {
    return undefined;
  }
  const alias = getPreviewAlias({
    branch,
    workerName: apiPreviewHost.split(".")[0],
  });
  return alias ? `https://${alias}-${apiPreviewHost}` : undefined;
}
