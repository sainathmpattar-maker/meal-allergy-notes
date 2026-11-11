import { useEffect } from 'react'

export default function useDocumentTitle(title) {
  useEffect(() => {
    const baseTitle = 'MealAllergy Notes'
    document.title = title ? `${title} | ${baseTitle}` : `${baseTitle} — Safe Dining & Human Verification`
  }, [title])
}
