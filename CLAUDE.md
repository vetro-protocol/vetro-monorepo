# Coding Conventions

## JavaScript/TypeScript

- **Alphabetical sorting**: Sort object properties, function parameters, and imports alphabetically
- **Function declarations**: Use full function expressions, not arrow functions. Exception: single-expression arrow functions with implicit returns are allowed (e.g., `const foo = () => 0;` or `array.filter(element => element > 45)`)
- **Variable naming**: Use camelCase for variables
- **Function parameters**: Use an object for functions requiring 2+ parameters. Exception: facade/adapter functions may maintain their original signature

## TypeScript

- **Type vs Interface**: Prefer `type` over `interface`, except for module augmentation
- **Expected errors**: Use `@ts-expect-error [explanation]` instead of `as any` for known type issues
- **Avoid `as any`**: Only use as a last resort when alternatives are significantly more complex
