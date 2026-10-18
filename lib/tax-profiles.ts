export function validateTaxProfileDeletion(actorRole: string, recordedSaleCount: number) {
  if (actorRole !== "owner") throw new Error("Only an owner can delete tax profiles.");
  if (recordedSaleCount > 0) {
    throw new Error("This tax profile is used by recorded sales and cannot be deleted. Turn off Profile active instead to preserve your tax history.");
  }
}
