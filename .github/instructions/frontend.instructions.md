---
applyTo: "src/components/**/*.{tsx,jsx}"
---

# React Component Guidelines

## Component Structure

- Use functional components with hooks
- Keep components small and focused (under 200 lines)
- Extract reusable logic into custom hooks

## State Management

- Use useState for local component state
- Use useContext for shared state across components
- Avoid prop drilling beyond 2-3 levels

## Accessibility

- All interactive elements must be keyboard accessible
- Include appropriate ARIA labels
- Ensure color contrast meets WCAG AA standards
