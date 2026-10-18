export function validateTaxProfileDeletion(actorRole: string) {
  if (actorRole !== "owner") throw new Error("Only an owner can delete tax profiles.");
}
