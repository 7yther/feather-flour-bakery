export function validateTaxProfileDeletion(actorRole: string) {
  if (actorRole !== "owner") throw new Error("Only an owner can delete tax profiles.");
}

export function activeTaxComponents<T extends { profileId: string; active: boolean }>(components: T[], profileId: string) {
  return components.filter((component) => component.profileId === profileId && component.active);
}
