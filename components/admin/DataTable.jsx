// Re-export shim — the real implementation moved to ./data-table/DataTable.jsx
// (pagination, search, generic + date/time filters, rows-per-page, Excel/PDF
// export). Kept at this path so every existing `@/components/admin/DataTable`
// import across the app keeps working unchanged.
export { default } from './data-table'
