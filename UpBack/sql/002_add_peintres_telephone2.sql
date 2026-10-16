-- Optional second phone number: some painters in the initial import list
-- have two numbers ("26014476/46781620").
ALTER TABLE `Peintres`
  ADD COLUMN `Telephone2` varchar(50) NULL AFTER `Telephone`;
