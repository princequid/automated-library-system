INSERT INTO settings (key, value, type, description) VALUES
-- Fine rates
('fine.rate.daily',           '5.00',  'NUMBER',  'Daily overdue fine rate in currency units'),
('fine.rate.lost',            '50.00', 'NUMBER',  'Flat fee charged when a copy is declared lost'),

-- Loan periods
('loan.period.days.student',  '14',    'NUMBER',  'Default loan period in days for students'),
('loan.period.days.staff',    '30',    'NUMBER',  'Default loan period in days for staff'),

-- Loan limits
('loan.max.books.student',    '5',     'NUMBER',  'Maximum concurrent loans for students'),
('loan.max.books.staff',      '10',    'NUMBER',  'Maximum concurrent loans for staff'),

-- Renewals
('loan.max.renewals',         '3',     'NUMBER',  'Maximum number of times a loan may be renewed'),
('loan.renewal.period.days',  '14',    'NUMBER',  'Number of days added per renewal'),

-- Reservations
('reservation.expiry.days',   '3',     'NUMBER',  'Days patron has to collect a ready reservation before it expires'),

-- RFID integration
('rfid.enabled',              'false', 'BOOLEAN', 'Enable RFID-based copy tracking'),
('rfid.scan.auto_checkout',   'false', 'BOOLEAN', 'Automatically issue loans when an RFID scan is detected'),

-- Notifications
('notification.email.enabled','true',  'BOOLEAN', 'Send email notifications to patrons'),
('notification.sms.enabled',  'false', 'BOOLEAN', 'Send SMS notifications to patrons'),
('notification.due.reminder.days', '3','NUMBER',  'Days before due date to send a reminder notification'),

-- Integrations
('sis.sync.enabled',          'false', 'BOOLEAN', 'Enable automatic sync with the Student Information System'),

-- Digital resources
('digital.max.concurrent.loans', '3', 'NUMBER',  'Maximum simultaneous digital loans per title'),

-- Catalog
('catalog.isbn.lookup.enabled','true', 'BOOLEAN', 'Enable automatic metadata lookup via ISBN (Open Library)');
