/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/components/mobile/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-container-highest": "#e0e3e5",
        "tertiary-container": "#271901",
        "tertiary-fixed-dim": "#f59e0b", // Mapped to desktop --amber (#f59e0b)
        "secondary": "#2F7BFF", // Mapped to desktop --accent (#2F7BFF)
        "on-secondary-container": "#fefcff",
        "secondary-fixed": "#eff6ff", // Mapped to desktop --accent-light (#eff6ff)
        "on-error-container": "#93000a",
        "on-surface": "#191c1e",
        "inverse-primary": "#bec6e0",
        "surface-tint": "#565e74",
        "primary-container": "#0B1628", // Mapped to desktop --navy (#0B1628)
        "surface-container": "#eceef0",
        "surface-bright": "#f7f9fb",
        "on-primary-fixed-variant": "#3f465c",
        "on-secondary-fixed": "#001a42",
        "surface-container-lowest": "#ffffff",
        "inverse-on-surface": "#eff1f3",
        "on-secondary": "#ffffff",
        "on-background": "#191c1e",
        "on-tertiary": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "inverse-surface": "#2d3133",
        "outline": "#76777d",
        "on-surface-variant": "#45464d",
        "success": "#10b981", // Mapped to desktop --green (#10b981)
        "on-tertiary-container": "#98805d",
        "on-primary": "#ffffff",
        "outline-variant": "#c6c6cd",
        "primary-fixed-dim": "#bec6e0",
        "on-error": "#ffffff",
        "on-tertiary-fixed-variant": "#574425",
        "on-primary-fixed": "#131b2e",
        "error-container": "#ffdad6",
        "tertiary-fixed": "#fcdeb5",
        "primary-fixed": "#dae2fd",
        "surface-variant": "#e0e3e5",
        "on-secondary-fixed-variant": "#004395",
        "background": "#f5f7fa", // Mapped to desktop --surface2 (#f5f7fa)
        "surface-container-high": "#e6e8ea",
        "error": "#ef4444", // Mapped to desktop --red (#ef4444)
        "primary": "#000000",
        "border": "#e2e8f0", // Mapped to desktop --border (#e2e8f0)
        "surface": "#FFFFFF",
        "tertiary": "#000000",
        "on-primary-container": "#7c839b",
        "surface-dim": "#d8dadc",
        "on-tertiary-fixed": "#271901",
        "secondary-container": "#2170e4",
        "secondary-fixed-dim": "#adc6ff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "md": "16px",
        "sm": "8px",
        "3xl": "64px",
        "container-max": "1280px",
        "gutter": "24px",
        "xs": "4px",
        "base": "4px",
        "2xl": "48px",
        "lg": "24px",
        "xl": "32px"
      },
      fontFamily: {
        "headline-lg-mobile": ["Plus Jakarta Sans"],
        "headline-lg": ["Plus Jakarta Sans"],
        "headline-md": ["Plus Jakarta Sans"],
        "label-sm": ["Plus Jakarta Sans"],
        "body-sm": ["Plus Jakarta Sans"],
        "body-md": ["Plus Jakarta Sans"],
        "label-md": ["Plus Jakarta Sans"],
        "body-lg": ["Plus Jakarta Sans"],
        "headline-sm": ["Plus Jakarta Sans"],
        "display-lg": ["Plus Jakarta Sans"]
      },
      fontSize: {
        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "display-lg": ["48px", { "lineHeight": "60px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
      }
    },
  },
  plugins: [],
}
