import pool from "../config/db.js";

// Final schema for the whole project. Safe to run more than once:
// CREATE TABLE IF NOT EXISTS skips tables that already exist,
// and INSERT IGNORE skips starting rows that already exist.
const TABLES = [
  ["admins", `CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`],

  ["settings", `CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(150),
    logo VARCHAR(500),
    logo_file_id VARCHAR(100),
    phone_primary VARCHAR(30),
    phone_secondary VARCHAR(30),
    email VARCHAR(150),
    whatsapp VARCHAR(30),
    address TEXT,
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    linkedin VARCHAR(255),
    map_embed TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`],

  ["categories", `CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    short_description VARCHAR(255),
    description TEXT,
    image VARCHAR(500),
    image_file_id VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`],

  ["products", `CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) NOT NULL UNIQUE,
    short_description VARCHAR(255),
    description TEXT,
    material VARCHAR(150),
    gsm VARCHAR(50),
    size VARCHAR(150),
    colors VARCHAR(255),
    moq VARCHAR(100),
    packaging VARCHAR(255),
    specifications JSON NULL,
    is_featured TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  )`],

  ["product_images", `CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image VARCHAR(500) NOT NULL,
    image_file_id VARCHAR(100),
    is_primary TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )`],

  ["hero_slides", `CREATE TABLE IF NOT EXISTS hero_slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subtitle VARCHAR(150),
    title VARCHAR(200) NOT NULL,
    button_text VARCHAR(50) DEFAULT 'Enquire Now',
    button_link VARCHAR(255) DEFAULT '/contact',
    image VARCHAR(500) NOT NULL,
    image_file_id VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`],

  ["gallery", `CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150),
    section VARCHAR(50) NOT NULL DEFAULT 'details',
    image VARCHAR(500) NOT NULL,
    image_file_id VARCHAR(100),
    width INT NULL,
    height INT NULL,
    category_id INT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  )`],

  ["certificates", `CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    issuer VARCHAR(150),
    cert_number VARCHAR(100),
    description TEXT,
    image VARCHAR(500) NOT NULL,
    image_file_id VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`],

  ["testimonials", `CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    company VARCHAR(150),
    country VARCHAR(100),
    message TEXT NOT NULL,
    rating TINYINT DEFAULT 5,
    photo VARCHAR(500),
    photo_file_id VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`],

  ["inquiries", `CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    company VARCHAR(150),
    country VARCHAR(100),
    category_id INT NULL,
    product_id INT NULL,
    quantity VARCHAR(100),
    message TEXT,
    source ENUM('quote_modal','contact_page','product_page') DEFAULT 'contact_page',
    channel ENUM('whatsapp','email') NULL,
    status ENUM('new','contacted','closed') DEFAULT 'new',
    admin_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  )`],

  ["about_content", `CREATE TABLE IF NOT EXISTS about_content (
    id INT PRIMARY KEY DEFAULT 1,
    banner_image VARCHAR(500), banner_image_file_id VARCHAR(100),
    story_title VARCHAR(200),
    highlight VARCHAR(200),
    story_text TEXT,
    story_image_main VARCHAR(500), story_image_main_file_id VARCHAR(100),
    story_image_secondary VARCHAR(500), story_image_secondary_file_id VARCHAR(100),
    founder_name VARCHAR(100),
    founder_title VARCHAR(100),
    founder_message TEXT,
    founder_image VARCHAR(500), founder_image_file_id VARCHAR(100),
    mission TEXT,
    vision TEXT,
    karur_title VARCHAR(200),
    karur_text TEXT,
    karur_image VARCHAR(500), karur_image_file_id VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`],

  ["highlights", `CREATE TABLE IF NOT EXISTS highlights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    text VARCHAR(200),
    icon VARCHAR(50) DEFAULT 'Sparkles',
    image VARCHAR(500),
    image_file_id VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`],
];

const STORY = `DJ EXPORTS is an emerging Indian export company specialising in quality home textile products for customers and buyers across international markets.

Founded in 2026 by a new-age woman entrepreneur, we bring a fresh and modern approach to the home textile export industry, with a strong focus on quality, customer satisfaction and global opportunities.

Based in Karur, Tamil Nadu, the renowned Home Textile City of India, we are committed to consistent quality, competitive pricing, professional service and on-time delivery to meet the needs of our global buyers.

We believe in building strong, long-term business relationships through trust, quality and customer satisfaction. Our goal is to grow as a trusted global supplier of Indian home textile products.`;

const KARUR = `Karur in Tamil Nadu is one of India's best-known centres for home textiles, producing kitchen, table, bath and bed linen for buyers around the world.

Being based in Karur gives us close access to experienced mills and skilled weavers, so we can source consistent quality, offer customisation and coordinate every order closely from production to dispatch.`;

try {
  for (const [name, sql] of TABLES) {
    await pool.query(sql);
    console.log(`✓ table ${name}`);
  }

  // Starting rows (skipped if they already exist)
  await pool.query(
    "INSERT IGNORE INTO settings (id, site_name, phone_primary, email, whatsapp, address) VALUES (1, ?, ?, ?, ?, ?)",
    ["DJ EXPORTS", "+91 0000000000", "info@example.com", "910000000000", "Karur, Tamil Nadu, India"]
  );

  await pool.query(
    `INSERT IGNORE INTO categories (name, slug, short_description, sort_order) VALUES
     ('Kitchen Linen', 'kitchen-linen', 'Absorbent cotton tea towels, aprons and chef pads.', 1),
     ('Table Linen', 'table-linen', 'Tablecloths, placemats, runners and napkins.', 2),
     ('Bath Linen', 'bath-linen', 'Plush cotton towels, bath sheets and bathrobes.', 3),
     ('Bed Linen', 'bed-linen', 'Soft, breathable bedsheets and pillow covers.', 4)`
  );

  await pool.query(
    `INSERT IGNORE INTO about_content (id, story_title, highlight, story_text, mission, vision, karur_title, karur_text)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Karur's home textile excellence, delivered to the world.",
      "Founded in 2026 by a New-Age Woman Entrepreneur",
      STORY,
      "To connect global buyers with quality Indian home textiles through reliable sourcing, professional service and timely delivery.",
      "To make quality Indian home textiles a trusted choice worldwide.",
      "Why Karur, the Home Textile City of India",
      KARUR,
    ]
  );

  console.log("✓ starting data added");

  const [tables] = await pool.query("SHOW TABLES");
  console.log(`\nDone. ${tables.length} tables in the database.`);
} catch (err) {
  console.error("\nSETUP FAILED:", err.message);
} finally {
  await pool.end();
}