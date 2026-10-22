// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");
const path = require("path");

const paymentsPath = path.join(__dirname, "payments.jsonl");
const expectedPath = path.join(__dirname, "expected.txt");
const latestAttempts = new Map();

for (const line of fs.readFileSync(paymentsPath, "utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  if (!event || !event.txn_id) continue;

  const timestamp = Date.parse(event.ts);
  const current = latestAttempts.get(event.txn_id);
  if (!current || timestamp >= current.timestamp) {
    latestAttempts.set(event.txn_id, { event, timestamp });
  }
}

let totalCents = 0;
let count = 0;
for (const { event } of latestAttempts.values()) {
  if (event.status !== "success") continue;

  const amount = Number(String(event.amount).replace(/,/g, ""));
  totalCents += Math.round(amount * 100);
  count += 1;
}

const expected = parseInt(fs.readFileSync(expectedPath, "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(totalCents / 100)}`);
}
