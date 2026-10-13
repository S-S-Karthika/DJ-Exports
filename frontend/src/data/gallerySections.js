export const GALLERY_SECTIONS = [
  { value: "details", label: "Fabric & Details" },
  { value: "production", label: "Production" },
  { value: "quality", label: "Quality Check" },
  { value: "packing", label: "Packing & Dispatch" },
  { value: "samples", label: "Samples" },
  { value: "team", label: "Team & Office" },
];

export const sectionLabel = (value) => GALLERY_SECTIONS.find((s) => s.value === value)?.label || value;