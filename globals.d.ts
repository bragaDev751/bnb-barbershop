// globals.d.ts
// Declara módulos CSS para o TypeScript parar de reclamar do import "./globals.css"
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}
