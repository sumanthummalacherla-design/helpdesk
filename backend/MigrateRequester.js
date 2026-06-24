require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Ticket = require('./models/Tickets');

async function migrate() {
  if (!process.env.MONGO_DB_URL) {
    throw new Error('MONGO_DB_URL is not set');
  }

  await mongoose.connect(process.env.MONGO_DB_URL);
  console.log('Connected to MongoDB');

  // Find all tickets missing requesterName
  const tickets = await Ticket.find({ requesterName: { $in: [null, undefined, ''] } });
  console.log(`Found ${tickets.length} tickets to backfill`);

  let updated = 0;
  let skipped = 0;

  for (const ticket of tickets) {
    if (!ticket.user) {
      console.log(`  Ticket #${ticket.id} — no user reference, skipping`);
      skipped++;
      continue;
    }

    const user = await User.findById(ticket.user);
    if (!user) {
      console.log(`  Ticket #${ticket.id} — user not found (${ticket.user}), skipping`);
      skipped++;
      continue;
    }

    await Ticket.updateOne(
      { _id: ticket._id },
      { $set: { requesterName: user.displayName } }
    );
    console.log(`  Ticket #${ticket.id} — set requesterName to "${user.displayName}"`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});