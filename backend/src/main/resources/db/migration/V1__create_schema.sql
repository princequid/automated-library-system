-- audit_log
CREATE TABLE audit_log (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36),
    action VARCHAR(20) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(36),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- users
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    university_id VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    year_of_study INT,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    password_hash VARCHAR(255),
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- settings
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- catalog_items
CREATE TABLE catalog_items (
    id VARCHAR(36) PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    year INT,
    abstract_text TEXT,
    shelf_location VARCHAR(100),
    format VARCHAR(20) NOT NULL DEFAULT 'PHYSICAL',
    cover_url TEXT,
    available_copies INT NOT NULL DEFAULT 0,
    total_copies INT NOT NULL DEFAULT 0,
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);
CREATE INDEX idx_catalog_items_isbn ON catalog_items(isbn);
CREATE INDEX idx_catalog_items_available ON catalog_items(available_copies);

-- catalog_item_subjects (ElementCollection)
CREATE TABLE catalog_item_subjects (
    catalog_item_id VARCHAR(36) NOT NULL REFERENCES catalog_items(id),
    subject_tags VARCHAR(255) NOT NULL
);

-- copies
CREATE TABLE copies (
    id VARCHAR(36) PRIMARY KEY,
    catalog_item_id VARCHAR(36) NOT NULL REFERENCES catalog_items(id),
    barcode VARCHAR(100) UNIQUE NOT NULL,
    rfid_tag VARCHAR(100) UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    condition VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_copies_catalog_item ON copies(catalog_item_id);
CREATE INDEX idx_copies_status ON copies(status);

-- loans
CREATE TABLE loans (
    id VARCHAR(36) PRIMARY KEY,
    copy_id VARCHAR(36) NOT NULL REFERENCES copies(id),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP NOT NULL,
    returned_at TIMESTAMP,
    renewal_count INT NOT NULL DEFAULT 0,
    issued_by VARCHAR(36) NOT NULL,
    returned_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_copy_id ON loans(copy_id);
CREATE INDEX idx_loans_returned_at ON loans(returned_at);
CREATE INDEX idx_loans_due_date ON loans(due_date);

-- fines
CREATE TABLE fines (
    id VARCHAR(36) PRIMARY KEY,
    loan_id VARCHAR(36) NOT NULL REFERENCES loans(id),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    amount NUMERIC(10,2) NOT NULL,
    reason VARCHAR(255),
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fines_user_id ON fines(user_id);
CREATE INDEX idx_fines_paid ON fines(paid);

-- reservations
CREATE TABLE reservations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    catalog_item_id VARCHAR(36) NOT NULL REFERENCES catalog_items(id),
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING',
    ready_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reservations_catalog_item ON reservations(catalog_item_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- notifications
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- digital_resources
CREATE TABLE digital_resources (
    id VARCHAR(36) PRIMARY KEY,
    catalog_item_id VARCHAR(36) UNIQUE NOT NULL REFERENCES catalog_items(id),
    storage_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    drm_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_concurrent_loans INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- acquisition_requests
CREATE TABLE acquisition_requests (
    id VARCHAR(36) PRIMARY KEY,
    requested_by VARCHAR(36) NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(20),
    justification TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by VARCHAR(36) REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
