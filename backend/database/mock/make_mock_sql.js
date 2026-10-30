const slots = require("../../../frontend/public/building/slots.json").slots;

const usedSlotKeys = new Set(["R03-C04", "R03-C09", "R03-C14", "R04-C06", "R04-C11", "R05-C08", "R06-C12", "R07-C05", "R08-C10", "R09-C07"]);
const glassSlots = slots.filter((slot) => slot.type === "glass" && !usedSlotKeys.has(slot.key));
const blockCount = 28;
const stepSize = glassSlots.length / blockCount;
const chosenSlots = Array.from({ length: blockCount }, (_, index) => glassSlots[Math.floor(index * stepSize)]);

const captions = ["Opening day", "The common hall", "Volunteers at work", "Evening classes", "Neighbours gathering"];
const names = ["Hall of Hope", "iLEARN", "Garden Room", "iCARE", "Music Room", "Reading Nook", "Workshop", "Health Desk", "Youth Lounge", "Elders Circle"];
const lines = ["SET NAMES utf8mb4;"];

chosenSlots.forEach((slot, index) => {
  const code = `M${String(index + 1).padStart(2, "0")}`;
  const floor = Math.ceil(slot.row / 2);
  const name = `${names[index % names.length]} ${code}`;
  lines.push(
    `INSERT IGNORE INTO blocks (code, name, tagline, floor, face, window_start, window_span, story_html, sort_order, is_published, slot_key) VALUES ('${code}', '${name}', 'Mock window for preview', ${floor}, 'front', ${slot.col}, 1, '<p>Mock story for ${name}. A community room supported by neighbours.</p>', ${100 + index}, 1, '${slot.key}');`
  );

  const imageCount = 1 + (index % 3);
  for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
    const fileNumber = ((index + imageIndex) % 5) + 1;
    lines.push(
      `INSERT INTO block_media (block_id, kind, file_path, caption, sort_order) SELECT id, 'image', 'uploads/mock/${fileNumber}.jpg', '${captions[fileNumber - 1]}', ${imageIndex + 1} FROM blocks WHERE code = '${code}';`
    );
  }

  const isLit = index % 5 !== 4;
  if (isLit) {
    const token = `mock${String(index).padStart(2, "0")}`.padEnd(32, "0");
    lines.push(
      `INSERT INTO donations (public_token, block_id, donor_name, donor_email, show_publicly, amount_minor, total_minor, currency, gateway, status, paid_at) SELECT '${token}', id, 'Mock Donor ${index + 1}', 'mock${index + 1}@example.com', 1, 500000, 500000, 'INR', 'razorpay', 'paid', NOW() FROM blocks WHERE code = '${code}';`
    );
  }
});

lines.push("DELETE FROM block_media WHERE block_id = (SELECT id FROM blocks WHERE code = '1D') AND kind = 'embed';");
captions.forEach((caption, index) => {
  lines.push(
    `INSERT INTO block_media (block_id, kind, file_path, caption, sort_order) SELECT id, 'image', 'uploads/mock/${index + 1}.jpg', '${caption}', ${10 + index} FROM blocks WHERE code = '1D';`
  );
});

process.stdout.write(lines.join("\n") + "\n");
