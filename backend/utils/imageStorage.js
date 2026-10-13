import imagekit from "../config/imagekit.js";

export const uploadToImageKit = async (file, folder) => {
  const safeName = file.originalname.replace(/[^\w.-]/g, "_");
  const result = await imagekit.upload({
    file: file.buffer,
    fileName: safeName,
    folder: `/djexports/${folder}`,
    useUniqueFileName: true,
  });
    return { url: result.url, fileId: result.fileId, width: result.width, height: result.height };
};

// Never throws: a failed cleanup shouldn't break the user's action
export const deleteFromImageKit = async (fileId) => {
  if (!fileId) return;
  try {
    await imagekit.deleteFile(fileId);
  } catch (err) {
    console.error("ImageKit delete failed:", fileId, err.message);
  }
};