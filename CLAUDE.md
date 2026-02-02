# Coding Conventions

## CSS

- Use tailwind v4 classes
- If setting width and height to the same value (like `w-2 h-2`), use the alternative class `size-*`. For example: `size-2`.

## JavaScript/TypeScript

- **Alphabetical sorting**: Sort object properties, function parameters, imports and types properties alphabetically
- **Function declarations**: Use full function expressions, not arrow functions. Exception: single-expression arrow functions with implicit returns are allowed (e.g., `const foo = () => 0;` or `array.filter(element => element > 45)`)
- **Variable naming**: Use camelCase for variables
- **Function parameters**: Use an object for functions requiring 2+ parameters. Exception: facade/adapter functions may maintain their original signature

## TypeScript

- **Array syntax**: Prefer `T[]` over `Array<T>`
- **Avoid `as any`**: Only use as a last resort when alternatives are significantly more complex
- **Expected errors**: Use `@ts-expect-error [explanation]` instead of `as any` for known type issues
- **Return types**: Omit explicit return types when the compiler can infer them
- **Type vs Interface**: Prefer `type` over `interface`, except for module augmentation
