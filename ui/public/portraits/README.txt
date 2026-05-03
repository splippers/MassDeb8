Portrait thumbnails for the Arena “debate flank” columns.

FILE LOCATION (dev & production builds)
  ui/public/portraits/<slug>.png
  Served at: http(s)://<arena-host>:<port>/portraits/<slug>.png

FILENAME (slug)
  Matches the debater’s persona key from the roster — lowercase, letters/digits only,
  non-alphanumerics replaced with underscores.
  Examples:
    nietzsche.png
    aristotle.png
    holy_roman_emperor.png
    confucius.png   — optional tile for the referee (Chair strip)

  If no file exists, the UI shows a gradient placeholder with initials.

IMAGE SPECS (recommended)
  • Format: PNG with transparency optional (square crops look best in the frame).
  • Pixel size: 256 × 256 px (display ~72–80 CSS px; good for retina).
  • Aspect: 1:1 square — images are cropped with object-fit: cover inside a circle.
  • Color: Your PNG is cropped to a centered circle; keep faces slightly inset so
    nothing important touches the edge.

NAMING COLLISIONS
  Two debaters using the same persona share one portrait file (normally desired).
