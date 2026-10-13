export const ik = (url, transform) => {
  if (!url || !url.includes("ik.imagekit.io") || url.includes("tr=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}tr=${transform}`;
};