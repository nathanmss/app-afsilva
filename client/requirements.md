## Packages
recharts | Dashboard analytics and visualizations
date-fns | Date formatting and manipulation

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["Inter", "sans-serif"],
  display: ["Outfit", "sans-serif"],
}

Auth pattern:
- Check /api/user on load
- Redirect to /auth if 401
- Use standard fetch with credentials: "include"
