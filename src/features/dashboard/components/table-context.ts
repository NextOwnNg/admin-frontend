import { createContext } from 'react'

/** Set where a figure table is kept only for screen readers (chart view): it neither scrolls nor takes focus there */
export const ScreenReaderOnlyTable = createContext(false)
