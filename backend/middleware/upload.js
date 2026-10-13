import multer from "multer";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    const err = new Error("Only JPG, PNG or WEBP images are allowed");
    err.field = file.fieldname;
    cb(err);
  },
});

const handle = (middleware, defaultField) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (err) {
      let message = err.message;
      if (err.code === "LIMIT_FILE_SIZE") message = "Each image must be under 5 MB";
      if (err.code === "LIMIT_UNEXPECTED_FILE") message = "Too many images in one upload";
      const field = err.field || defaultField;
      return res.status(400).json({ message, errors: { [field]: message } });
    }
    next();
  });
};

export const uploadSingle = (field) => handle(multerUpload.single(field), field);

export const uploadFields = (fields) =>
  handle(multerUpload.fields(fields.map((name) => ({ name, maxCount: 1 }))), fields[0]);

export const uploadArray = (field, max) => handle(multerUpload.array(field, max), field);