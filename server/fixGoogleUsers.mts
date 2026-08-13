import { pathToFileURL } from "node:url";
import { repairIncompleteGoogleUsers } from "./db";

export async function repairGoogleUserMetadata() {
  const result = await repairIncompleteGoogleUsers();
  console.log(`Repaired ${result.repaired} incomplete Google-linked user record(s).`);
  if (result.requiresEmailRecovery > 0) {
    console.log(`${result.requiresEmailRecovery} Google-linked user record(s) have no recoverable historical email. Their email will be restored securely on the account's next Google sign-in.`);
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  repairGoogleUserMetadata().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error("Google user metadata repair failed:", error);
    process.exit(1);
  });
}
