import pool from "../config/db.js";

export const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT site_name, logo, phone_primary, phone_secondary, email, whatsapp, address,
              facebook, instagram, linkedin, map_embed
       FROM settings WHERE id = 1`
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error("getSettings failed:", err.message);
    res.status(500).json({ message: "Failed to load settings" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.short_description, c.description, c.image,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
       FROM categories c WHERE c.is_active = 1
       ORDER BY c.sort_order, c.id`
    );
    res.json(rows);
  } catch (err) {
    console.error("getCategories failed:", err.message);
    res.status(500).json({ message: "Failed to load categories" });
  }
};
export const getGallery = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, section, image, width, height
       FROM gallery WHERE is_active = 1
       ORDER BY sort_order, id`
    );
    res.json(rows);
  } catch (err) {
    console.error("getGallery failed:", err.message);
    res.status(500).json({ message: "Failed to load gallery" });
  }
};

export const getHeroSlides = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, subtitle, title, button_text, button_link, image
       FROM hero_slides WHERE is_active = 1
       ORDER BY sort_order, id`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to load slides" });
  };
};
  export const getCertificates = async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, title, issuer, cert_number, description, image
        FROM certificates WHERE is_active = 1
        ORDER BY sort_order, id`
      );
      res.json(rows);
    } catch {
      res.status(500).json({ message: "Failed to load certificates" });
    }
  };

  export const getAboutContent = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT banner_image, story_title, highlight, story_text,
              story_image_main, story_image_secondary,
              founder_name, founder_title, founder_message, founder_image,
              mission, vision, karur_title, karur_text, karur_image
       FROM about_content WHERE id = 1`
    );
    res.json(rows[0] || {});
  } catch {
    res.status(500).json({ message: "Failed to load About content" });
  }
};


// Shared columns for product cards (cover photo + second photo for the hover effect)
const PRODUCT_CARD_SELECT = `
  SELECT p.id, p.name, p.slug, p.short_description, p.gsm, p.moq, p.material, p.is_featured,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
         (SELECT image FROM product_images pi WHERE pi.product_id = p.id
          ORDER BY pi.is_primary DESC, pi.sort_order, pi.id LIMIT 1) AS image,
         (SELECT image FROM product_images pi WHERE pi.product_id = p.id
          ORDER BY pi.is_primary DESC, pi.sort_order, pi.id LIMIT 1 OFFSET 1) AS image_hover
  FROM products p JOIN categories c ON c.id = p.category_id`;

export const getProducts = async (req, res) => {
  try {
    const { category, featured, limit } = req.query;
    const where = ["p.is_active = 1", "c.is_active = 1"];
    const params = [];
    if (category) {
      where.push("c.slug = ?");
      params.push(category);
    }
    if (featured === "1") where.push("p.is_featured = 1");
    const lim = Math.min(Math.max(Number(limit) || 200, 1), 200);

    const [rows] = await pool.query(
      `${PRODUCT_CARD_SELECT}
       WHERE ${where.join(" AND ")}
       ORDER BY p.is_featured DESC, c.sort_order, p.created_at DESC
       LIMIT ?`,
      [...params, lim]
    );
    res.json(rows);
  } catch (err) {
    console.error("getProducts failed:", err.message);
    res.status(500).json({ message: "Failed to load products" });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.short_description, p.description, p.material, p.gsm,
              p.size, p.colors, p.moq, p.packaging, p.specifications,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1 AND c.is_active = 1`,
      [req.params.slug]
    );
    const product = rows[0];
    if (!product) return res.status(404).json({ message: "Product not found" });

    const [images] = await pool.query(
      "SELECT id, image FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order, id",
      [product.id]
    );
    const [related] = await pool.query(
      `${PRODUCT_CARD_SELECT}
       WHERE p.category_id = ? AND p.id <> ? AND p.is_active = 1
       ORDER BY p.is_featured DESC, RAND()
       LIMIT 4`,
      [product.category_id, product.id]
    );

    res.json({ ...product, images, related });
  } catch (err) {
    console.error("getProductBySlug failed:", err.message);
    res.status(500).json({ message: "Failed to load product" });
  }
};


// The browser tab icon: always redirects to the logo uploaded in Admin → Logo
export const getFavicon = async (req, res) => {
  try {
    const [[row]] = await pool.query("SELECT logo FROM settings WHERE id = 1");
    if (!row?.logo) return res.status(404).end();
    const sep = row.logo.includes("?") ? "&" : "?";
    res.set("Cache-Control", "public, max-age=3600");
    res.redirect(302, `${row.logo}${sep}tr=w-64,h-64,cm-pad_resize`);
  } catch (err) {
    console.error("getFavicon failed:", err.message);
    res.status(500).end();
  }
};