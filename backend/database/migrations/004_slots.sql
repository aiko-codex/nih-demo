SET NAMES utf8mb4;

ALTER TABLE blocks
  ADD COLUMN slot_key VARCHAR(8) NULL,
  ADD UNIQUE KEY uq_blocks_slot (slot_key);

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('max_donors_per_block', '1');

UPDATE blocks SET slot_key = 'R03-C04' WHERE code = '1A';
UPDATE blocks SET slot_key = 'R03-C09' WHERE code = '1B';
UPDATE blocks SET slot_key = 'R03-C14' WHERE code = '1C';
UPDATE blocks SET slot_key = 'R04-C06' WHERE code = '1D';
UPDATE blocks SET slot_key = 'R04-C11' WHERE code = '1E';
UPDATE blocks SET slot_key = 'R05-C08' WHERE code = '1G';
UPDATE blocks SET slot_key = 'R06-C12' WHERE code = '3A';
UPDATE blocks SET slot_key = 'R07-C05' WHERE code = '5A';
UPDATE blocks SET slot_key = 'R08-C10' WHERE code = '7A';
UPDATE blocks SET slot_key = 'R09-C07' WHERE code = '7B';
