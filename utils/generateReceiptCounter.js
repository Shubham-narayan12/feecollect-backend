import ReceiptCounter from "../model/ReceiptCounterModel.js";

export const generateNextReceiptNo = async () => {
  const currentYear = new Date().getFullYear();

  // Check if counter exists for this year
  let counter = await ReceiptCounter.findOne({ year: currentYear });

  if (!counter) {
    counter = await ReceiptCounter.create({
      year: currentYear,
      lastNumber: 0,
    });
  }

  // Increment number
  counter.lastNumber += 1;
  await counter.save();

  // Format number: 00001 style
  const padded = String(counter.lastNumber).padStart(5, "0");

  return `${counter.prefix}-${currentYear}-${padded}`;
};
