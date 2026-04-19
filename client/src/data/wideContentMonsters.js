// Monsters with art content in the outer ~16.7% of the image (the portrait-rectangle
// cover crop zone). These use object-fit:contain in portrait-rectangle card layouts.
export const WIDE_CONTENT_MONSTERS = new Set([
  1, 5, 8, 9, 46, 68, 79, 85, 92, 97,
  104, 109, 114, 116, 151, 153, 154, 176, 189, 196,
  199, 204, 207, 218, 222, 223, 225, 227, 233, 244,
  245, 246, 248, 251, 252, 268, 293, 295, 296, 297,
  298, 299, 300, 301, 302, 303, 304, 305, 306, 307,
])

// Monsters with art content in the 16.7–22.2% margin zone. In portrait-rectangle
// layouts these use cover but skip the extra scale(1.2) zoom to avoid side clipping.
export const MEDIUM_CONTENT_MONSTERS = new Set([
  0, 2, 4, 11, 12, 23, 24, 25, 35, 38,
  49, 54, 56, 57, 69, 77, 78, 80, 94, 95,
  99, 111, 115, 117, 118, 120, 123, 129, 131, 137,
  139, 140, 142, 150, 155, 181, 188, 190, 193, 195,
  205, 206, 212, 213, 219, 220, 221, 224, 229, 230,
  236, 237, 241, 247, 249, 250, 253, 255, 257, 258,
  259, 263, 264, 265, 266, 272, 275, 277, 280, 287,
  288, 290, 291,
])
