function validExamDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value
}

export const EXAM_DATES = {
  deutsch: validExamDate(import.meta.env.VITE_EXAM_DATE_DEUTSCH) ?? '2027-05-11',
  englisch: validExamDate(import.meta.env.VITE_EXAM_DATE_ENGLISCH) ?? '2027-05-13',
  mathematik: validExamDate(import.meta.env.VITE_EXAM_DATE_MATHEMATIK) ?? '2027-05-20',
}
